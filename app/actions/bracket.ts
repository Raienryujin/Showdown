'use server';

import { createClient } from '@/utils/supabase/server';

export async function endRound(bracketId: string) {
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
      tiedMatchups.push(matchup.id);
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
