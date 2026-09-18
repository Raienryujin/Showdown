'use server';

import { createClient } from '@/utils/supabase/server';
import { randomUUID } from 'crypto';

/**
 * Creates a bracket and pre-allocates the entire tournament tree.
 * @param name - The name of the bracket
 * @param teams - An array of team names/IDs
 */
export async function createBracket(name: string, teams: string[]) {
  const supabase = await createClient();

  // 1. Verify User
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { status: 'ERROR', message: 'Unauthorized' };
  }
  const userId = userData.user.id;

  // 2. Insert the Bracket to get its ID
  const { data: bracket, error: bracketError } = await supabase
    .from('brackets')
    .insert({
      name,
      creator_id: userId,
      current_round: 1,
    })
    .select('id')
    .single();

  if (bracketError || !bracket) {
    console.error('Bracket Creation Error:', bracketError);
    return { status: 'ERROR', message: 'Failed to create bracket' };
  }

  const bracketId = bracket.id;

  // 3. Generate the Tournament Tree
  // Pad teams to the nearest power of 2
  const power = Math.ceil(Math.log2(teams.length || 1));
  const numTeams = Math.pow(2, power);
  
  const paddedTeams = [...teams];
  while (paddedTeams.length < numTeams) {
    paddedTeams.push(''); // Empty string will represent a BYE (using null can cause type mapping issues in JSON/SQL sometimes)
  }

  const numRounds = power;
  const matchupsToInsert: any[] = [];
  
  // Create the final match first
  const finalsId = randomUUID();
  matchupsToInsert.push({
    id: finalsId,
    bracket_id: bracketId,
    round_number: numRounds,
    team1_id: null,
    team2_id: null,
    winner_id: null,
    next_matchup_id: null,
    next_matchup_slot: null,
  });

  let currentRoundNodes: string[] = [finalsId];

  // Work backwards from Semifinals to Round 1
  for (let r = numRounds - 1; r >= 1; r--) {
    const nextRoundNodes: string[] = [];
    
    for (const parentId of currentRoundNodes) {
      // Slot 1 child
      const child1Id = randomUUID();
      matchupsToInsert.push({
        id: child1Id,
        bracket_id: bracketId,
        round_number: r,
        team1_id: null,
        team2_id: null,
        winner_id: null,
        next_matchup_id: parentId,
        next_matchup_slot: 1,
      });
      nextRoundNodes.push(child1Id);

      // Slot 2 child
      const child2Id = randomUUID();
      matchupsToInsert.push({
        id: child2Id,
        bracket_id: bracketId,
        round_number: r,
        team1_id: null,
        team2_id: null,
        winner_id: null,
        next_matchup_id: parentId,
        next_matchup_slot: 2,
      });
      nextRoundNodes.push(child2Id);
    }
    currentRoundNodes = nextRoundNodes;
  }

  // 4. Assign teams to the first round
  // Find all round 1 matchups in the array
  const round1Matchups = matchupsToInsert.filter((m) => m.round_number === 1);
  
  // Assign teams sequentially (for basic seeding, you'd sort paddedTeams differently first)
  let teamIndex = 0;
  for (const matchup of round1Matchups) {
    const t1 = paddedTeams[teamIndex++];
    const t2 = paddedTeams[teamIndex++];
    matchup.team1_id = t1 || null; // convert empty strings back to null
    matchup.team2_id = t2 || null;
  }

  // 5. Bulk insert the matchups
  const { error: matchupsError } = await supabase
    .from('matchups')
    .insert(matchupsToInsert);

  if (matchupsError) {
    console.error('Matchups Insertion Error:', matchupsError);
    // Cleanup the bracket since matchup creation failed
    await supabase.from('brackets').delete().eq('id', bracketId);
    return { status: 'ERROR', message: 'Failed to generate bracket tree' };
  }

  return { status: 'SUCCESS', bracketId };
}

export async function endRound(bracketId: string, tieOverrides?: Record<string, string>) {
  const supabase = await createClient();

  // 1. Verify User
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { status: 'ERROR', message: 'Unauthorized' };
  }
  const userId = userData.user.id;

  // 2. Fetch Bracket details and verify creator
  const { data: bracket, error: bracketError } = await supabase
    .from('brackets')
    .select('creator_id, current_round')
    .eq('id', bracketId)
    .single();

  if (bracketError || !bracket) {
    return { status: 'ERROR', message: 'Bracket not found' };
  }

  if (bracket.creator_id !== userId) {
    return { status: 'ERROR', message: 'Only the creator can end the round' };
  }

  // 3. Fetch matchups for the current round
  const { data: matchups, error: matchupsError } = await supabase
    .from('matchups')
    .select('id, team1_id, team2_id')
    .eq('bracket_id', bracketId)
    .eq('round_number', bracket.current_round);

  if (matchupsError || !matchups || matchups.length === 0) {
    return { status: 'ERROR', message: 'No matchups found for the current round' };
  }

  // 4. Fetch votes for these matchups
  const matchupIds = matchups.map((m) => m.id);
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('matchup_id, voted_for_id')
    .in('matchup_id', matchupIds);

  if (votesError) {
    return { status: 'ERROR', message: 'Failed to fetch votes' };
  }

  // 5. Tally votes and check for ties
  const tiedMatchups: string[] = [];
  const winners: { matchup_id: string; winner_id: string }[] = [];

  for (const matchup of matchups) {
    const matchupVotes = votes?.filter((v) => v.matchup_id === matchup.id) || [];
    
    // Count votes
    let team1Votes = 0;
    let team2Votes = 0;

    for (const vote of matchupVotes) {
      if (vote.voted_for_id === matchup.team1_id) team1Votes++;
      if (vote.voted_for_id === matchup.team2_id) team2Votes++;
    }

    // Handle byes or automatic wins if only one team exists in the matchup
    if (!matchup.team1_id && matchup.team2_id) {
       winners.push({ matchup_id: matchup.id, winner_id: matchup.team2_id });
       continue;
    }
    if (matchup.team1_id && !matchup.team2_id) {
       winners.push({ matchup_id: matchup.id, winner_id: matchup.team1_id });
       continue;
    }

    // Tie logic
    if (team1Votes === team2Votes) {
      if (tieOverrides && tieOverrides[matchup.id]) {
        winners.push({ matchup_id: matchup.id, winner_id: tieOverrides[matchup.id] });
      } else {
        tiedMatchups.push(matchup.id);
      }
    } else {
      const winnerId = team1Votes > team2Votes ? matchup.team1_id! : matchup.team2_id!;
      winners.push({ matchup_id: matchup.id, winner_id: winnerId });
    }
  }

  // 6. Return error state if ties detected
  if (tiedMatchups.length > 0) {
    return { 
      status: 'TIE_DETECTED', 
      tiedMatchups 
    };
  }

  // 7. Invoke RPC to update bracket state transactionally
  const { error: rpcError } = await supabase.rpc('advance_bracket_round', {
    p_bracket_id: bracketId,
    p_winners: winners,
  });

  if (rpcError) {
    console.error('RPC Error:', rpcError);
    return { status: 'ERROR', message: 'Failed to advance bracket round transactionally' };
  }

  return { status: 'SUCCESS' };
}

export async function deleteBracket(bracketId: string) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { status: 'ERROR', message: 'Unauthorized' };
  }
  const userId = userData.user.id;

  const { error } = await supabase
    .from('brackets')
    .delete()
    .eq('id', bracketId)
    .eq('creator_id', userId);

  if (error) {
    console.error('Delete Bracket Error:', error);
    return { status: 'ERROR', message: 'Failed to delete bracket' };
  }

  return { status: 'SUCCESS' };
}
