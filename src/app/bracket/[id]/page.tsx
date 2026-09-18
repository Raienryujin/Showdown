import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import BracketViewer from '@/components/BracketViewer';
import LogoutButton from '@/components/LogoutButton';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bracket, error: bracketError } = await supabase
    .from('brackets')
    .select('*')
    .eq('id', id)
    .single();

  if (bracketError || !bracket) {
    notFound();
  }

  const { data: matchups, error: matchupsError } = await supabase
    .from('matchups')
    .select('*')
    .eq('bracket_id', bracket.id)
    .order('round_number', { ascending: true });

  if (matchupsError || !matchups) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-neutral-400">
        Error loading bracket matchups
      </div>
    );
  }

  const { data: authData } = await supabase.auth.getUser();
  const isLoggedIn = !!authData?.user;
  const isCreator = authData?.user?.id === bracket.creator_id;

  let userVotes: Record<string, string> = {};
  let initialVoteCounts: Record<string, { team1: number, team2: number }> = {};
  
  // Initialize counts to 0 for all matchups
  matchups.forEach(m => {
    initialVoteCounts[m.id] = { team1: 0, team2: 0 };
  });

  const matchupIds = matchups.map(m => m.id);
  
  // Fetch ALL votes for these matchups
  const { data: allVotes } = await supabase
    .from('votes')
    .select('matchup_id, voted_for_id, user_id')
    .in('matchup_id', matchupIds);

  if (allVotes) {
    allVotes.forEach(vote => {
      // Find the matchup to know which team is which
      const m = matchups.find(match => match.id === vote.matchup_id);
      if (m) {
        if (vote.voted_for_id === m.team1_id) initialVoteCounts[m.id].team1++;
        if (vote.voted_for_id === m.team2_id) initialVoteCounts[m.id].team2++;
      }
      
      // If this vote belongs to the logged-in user, track it
      if (isLoggedIn && vote.user_id === authData?.user?.id) {
        userVotes[vote.matchup_id] = vote.voted_for_id;
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] p-6 sm:p-10 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="max-w-[1400px] mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-indigo-400 transition-colors mb-8">
          <Home size={16} /> Back to Dashboard
        </Link>

        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{bracket.name}</h1>
            <p className="text-neutral-400 mt-2 font-medium">Tournament Stage: <span className="text-indigo-400">Round {bracket.current_round}</span></p>
          </div>
          <div className="flex gap-3 items-center">
            {isLoggedIn && (
              <LogoutButton />
            )}
            {!isLoggedIn && (
              <div className="bg-neutral-800 text-neutral-300 px-4 py-1.5 rounded-full text-sm font-semibold border border-neutral-700">
                Viewing Only (Sign in to vote)
              </div>
            )}
            {isCreator && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                Host Mode
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#121212] p-8 rounded-2xl shadow-2xl border border-neutral-800 overflow-x-auto relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
          <BracketViewer 
            bracket={bracket} 
            matchups={matchups} 
            isCreator={isCreator} 
            isLoggedIn={isLoggedIn}
            userVotes={userVotes}
            initialVoteCounts={initialVoteCounts}
          />
        </div>
      </div>
    </main>
  );
}
