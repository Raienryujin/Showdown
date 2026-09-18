'use client';

import { useState, useEffect } from 'react';
import MatchupCard from './MatchupCard';
import { endRound } from '@/app/actions/bracket';
import { PlayCircle, ShieldAlert } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Bracket = {
  id: string;
  name: string;
  current_round: number;
  creator_id: string;
};

type Matchup = {
  id: string;
  bracket_id: string;
  round_number: number;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
  next_matchup_id: string | null;
  next_matchup_slot: number | null;
};

interface BracketViewerProps {
  bracket: Bracket;
  matchups: Matchup[];
  isCreator: boolean;
  isLoggedIn: boolean;
  userVotes: Record<string, string>;
  initialVoteCounts: Record<string, { team1: number, team2: number }>;
}

export default function BracketViewer({ bracket, matchups, isCreator, isLoggedIn, userVotes, initialVoteCounts }: BracketViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Realtime Vote Counts State
  const [voteCounts, setVoteCounts] = useState(initialVoteCounts);

  // Tie-Breaker State
  const [tiedMatchupIds, setTiedMatchupIds] = useState<string[]>([]);
  const [tieOverrides, setTieOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    
    const fetchMatchupVotes = async (matchupId: string) => {
      // Only refetch if it's a matchup we actually care about
      const m = matchups.find(match => match.id === matchupId);
      if (!m) return;

      const { data } = await supabase
        .from('votes')
        .select('voted_for_id')
        .eq('matchup_id', matchupId);
        
      if (data) {
        let t1 = 0; let t2 = 0;
        data.forEach(v => {
          if (v.voted_for_id === m.team1_id) t1++;
          if (v.voted_for_id === m.team2_id) t2++;
        });
        setVoteCounts(prev => ({ ...prev, [m.id]: { team1: t1, team2: t2 } }));
      }
    };

    // Subscribe to both INSERT and UPDATE (since changing a vote is an UPSERT)
    const channel = supabase
      .channel('public:votes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => fetchMatchupVotes(payload.new.matchup_id)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes' },
        (payload) => fetchMatchupVotes(payload.new.matchup_id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchups]);

  // Group matchups by round
  const maxRound = Math.max(...matchups.map(m => m.round_number));
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  const handleEndRound = async () => {
    setLoading(true);
    setError('');
    
    // Pass tieOverrides if we are submitting the tie-breaker resolution
    const isResolvingTies = tiedMatchupIds.length > 0;
    const result = await endRound(bracket.id, isResolvingTies ? tieOverrides : undefined);
    
    if (result.status === 'ERROR') {
      setError(result.message || 'Failed to end round.');
      setLoading(false);
    } else if (result.status === 'TIE_DETECTED') {
      // Instead of an error text, we open the tie-breaker modal
      setTiedMatchupIds(result.tiedMatchups || []);
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  const handleOverrideSelect = (matchupId: string, winnerId: string) => {
    setTieOverrides(prev => ({ ...prev, [matchupId]: winnerId }));
  };

  return (
    <div className="w-full">
      {/* TIE BREAKER MODAL */}
      {tiedMatchupIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <ShieldAlert className="text-red-500" /> Executive Override
            </h3>
            <p className="text-neutral-400 text-sm mb-6">
              The following matchups ended in a perfect tie. As the tournament host, you must cast the deciding vote to break the tie and advance the bracket.
            </p>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {tiedMatchupIds.map(id => {
                const m = matchups.find(match => match.id === id);
                if (!m) return null;
                const isT1Selected = tieOverrides[id] === m.team1_id;
                const isT2Selected = tieOverrides[id] === m.team2_id;

                return (
                  <div key={id} className="bg-neutral-900 rounded-xl p-3 border border-neutral-800">
                    <div className="text-xs text-neutral-500 mb-2 font-medium uppercase tracking-wider text-center">Break Tie</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOverrideSelect(id, m.team1_id!)}
                        className={`flex-1 py-3 px-2 rounded-lg font-semibold text-sm transition-all border ${
                          isT1Selected 
                            ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {m.team1_id}
                      </button>
                      <button
                        onClick={() => handleOverrideSelect(id, m.team2_id!)}
                        className={`flex-1 py-3 px-2 rounded-lg font-semibold text-sm transition-all border ${
                          isT2Selected 
                            ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {m.team2_id}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setTiedMatchupIds([]);
                  setTieOverrides({});
                }}
                className="flex-1 py-3 rounded-xl font-semibold text-neutral-400 bg-neutral-900 hover:bg-neutral-800 transition-all border border-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEndRound}
                disabled={loading || Object.keys(tieOverrides).length !== tiedMatchupIds.length}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resolving...' : 'Confirm Overrides'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 border border-red-500/20 flex items-center gap-3 shadow-sm">
          <ShieldAlert className="text-red-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {isCreator && (
        <div className="mb-10 flex justify-end">
          <button
            onClick={handleEndRound}
            disabled={loading || bracket.current_round > maxRound}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 border border-indigo-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <PlayCircle size={18} /> 
                {bracket.current_round > maxRound ? 'Tournament Complete' : `Resolve Round ${bracket.current_round}`}
              </>
            )}
          </button>
        </div>
      )}

      {/* DUAL-SIDED BRACKET LAYOUT */}
      {(() => {
        const finalsMatchup = matchups.find(m => m.round_number === maxRound);
        const leftSideIds = new Set<string>();
        const rightSideIds = new Set<string>();

        if (finalsMatchup && maxRound > 1) {
          const leftSemi = matchups.find(m => m.next_matchup_id === finalsMatchup.id && m.next_matchup_slot === 1);
          const rightSemi = matchups.find(m => m.next_matchup_id === finalsMatchup.id && m.next_matchup_slot === 2);
          
          let currentLeftParents = new Set(leftSemi ? [leftSemi.id] : []);
          let currentRightParents = new Set(rightSemi ? [rightSemi.id] : []);
          if (leftSemi) leftSideIds.add(leftSemi.id);
          if (rightSemi) rightSideIds.add(rightSemi.id);
          
          for (let r = maxRound - 2; r >= 1; r--) {
            const nextLeft = new Set<string>();
            const nextRight = new Set<string>();
            
            matchups.filter(m => m.round_number === r).forEach(m => {
              if (m.next_matchup_id && currentLeftParents.has(m.next_matchup_id)) {
                leftSideIds.add(m.id);
                nextLeft.add(m.id);
              }
              if (m.next_matchup_id && currentRightParents.has(m.next_matchup_id)) {
                rightSideIds.add(m.id);
                nextRight.add(m.id);
              }
            });
            currentLeftParents = nextLeft;
            currentRightParents = nextRight;
          }
        }

        const renderColumn = (roundNum: number, isRightSide: boolean) => {
          const roundMatchups = matchups.filter(m => m.round_number === roundNum && (isRightSide ? rightSideIds.has(m.id) : leftSideIds.has(m.id)));
          if (roundMatchups.length === 0) return null;

          const isCurrentRound = roundNum === bracket.current_round;
          const isPastRound = roundNum < bracket.current_round;

          const groupedObj = roundMatchups.reduce((acc, m) => {
            const key = m.next_matchup_id || 'final';
            if (!acc[key]) acc[key] = [];
            acc[key].push(m);
            return acc;
          }, {} as Record<string, Matchup[]>);

          const sortedMatchups = Object.values(groupedObj).flatMap(group => 
            group.sort((a, b) => (a.next_matchup_slot || 0) - (b.next_matchup_slot || 0))
          );

          const M = 40 * (Math.pow(2, roundNum - 1) - 1);
          const G = 80 * Math.pow(2, roundNum - 1) - 66;
          const lineH = 40 * Math.pow(2, roundNum - 1);

          return (
            <div key={`${isRightSide ? 'R' : 'L'}-${roundNum}`} className="flex flex-col w-[160px] min-w-[160px]">
              <div className="text-center mb-6">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  isCurrentRound ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : isPastRound ? 'bg-neutral-800 text-neutral-500 border border-neutral-700' 
                  : 'bg-neutral-900 text-neutral-600 border border-neutral-800'
                }`}>
                  Round {roundNum}
                </span>
              </div>
              
              <div className="flex flex-col">
                {sortedMatchups.map((matchup, idx) => (
                  <div key={matchup.id} className="relative z-10" style={{ marginTop: idx === 0 ? `${M}px` : `${G}px` }}>
                    <MatchupCard
                      matchup={matchup}
                      isActive={isCurrentRound}
                      isPast={isPastRound}
                      isLoggedIn={isLoggedIn}
                      initialVote={userVotes[matchup.id] || null}
                      voteCounts={voteCounts[matchup.id] || { team1: 0, team2: 0 }}
                    />

                    {/* Left Side Lines (Point Right) */}
                    {!isRightSide && roundNum < maxRound - 1 && matchup.next_matchup_slot === 1 && (
                      <>
                        <div className="absolute right-[-8px] top-[33px] w-[8px] border-t-2 border-r-2 border-neutral-700/50 rounded-tr-lg pointer-events-none z-0" style={{ height: `${lineH}px` }} />
                        <div className="absolute right-[-16px] w-[9px] h-[2px] bg-neutral-700/50 pointer-events-none z-0" style={{ top: `${33 + lineH}px` }} />
                      </>
                    )}
                    {!isRightSide && roundNum < maxRound - 1 && matchup.next_matchup_slot === 2 && (
                      <div className="absolute right-[-8px] w-[8px] border-b-2 border-r-2 border-neutral-700/50 rounded-br-lg pointer-events-none z-0" style={{ top: `${33 - lineH}px`, height: `${lineH}px` }} />
                    )}
                    {!isRightSide && roundNum === maxRound - 1 && (
                      <div className="absolute right-[-16px] top-[33px] w-[16px] h-[2px] bg-neutral-700/50 pointer-events-none z-0" />
                    )}
                    {!isRightSide && roundNum < maxRound - 1 && !matchup.next_matchup_slot && (
                      <div className="absolute right-[-16px] top-[33px] w-[16px] h-[2px] bg-neutral-700/50 pointer-events-none z-0" />
                    )}

                    {/* Right Side Lines (Point Left) */}
                    {isRightSide && roundNum < maxRound - 1 && matchup.next_matchup_slot === 1 && (
                      <>
                        <div className="absolute left-[-8px] top-[33px] w-[8px] border-t-2 border-l-2 border-neutral-700/50 rounded-tl-lg pointer-events-none z-0" style={{ height: `${lineH}px` }} />
                        <div className="absolute left-[-16px] w-[9px] h-[2px] bg-neutral-700/50 pointer-events-none z-0" style={{ top: `${33 + lineH}px` }} />
                      </>
                    )}
                    {isRightSide && roundNum < maxRound - 1 && matchup.next_matchup_slot === 2 && (
                      <div className="absolute left-[-8px] w-[8px] border-b-2 border-l-2 border-neutral-700/50 rounded-bl-lg pointer-events-none z-0" style={{ top: `${33 - lineH}px`, height: `${lineH}px` }} />
                    )}
                    {isRightSide && roundNum === maxRound - 1 && (
                      <div className="absolute left-[-16px] top-[33px] w-[16px] h-[2px] bg-neutral-700/50 pointer-events-none z-0" />
                    )}
                    {isRightSide && roundNum < maxRound - 1 && !matchup.next_matchup_slot && (
                      <div className="absolute left-[-16px] top-[33px] w-[16px] h-[2px] bg-neutral-700/50 pointer-events-none z-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        };

        const sideRounds = Array.from({ length: maxRound - 1 }, (_, i) => i + 1);

        return (
          <div className="flex gap-4 min-w-max pb-8 pt-4 items-start justify-center overflow-x-auto relative px-4">
            {/* Left Tree */}
            <div className="flex gap-4">
              {sideRounds.map(r => renderColumn(r, false))}
            </div>

            {/* Finals */}
            {finalsMatchup && (
              <div className="flex flex-col w-[160px] min-w-[160px]">
                <div className="text-center mb-6">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    bracket.current_round === maxRound ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                    : bracket.current_round > maxRound ? 'bg-neutral-800 text-neutral-500 border border-neutral-700' 
                    : 'bg-neutral-900 text-neutral-600 border border-neutral-800'
                  }`}>
                    Finals
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="relative z-10" style={{ marginTop: `${Math.max(0, 40 * (Math.pow(2, maxRound - 2) - 1))}px` }}>
                    <MatchupCard
                      matchup={finalsMatchup}
                      isActive={bracket.current_round === maxRound}
                      isPast={bracket.current_round > maxRound}
                      isLoggedIn={isLoggedIn}
                      initialVote={userVotes[finalsMatchup.id] || null}
                      voteCounts={voteCounts[finalsMatchup.id] || { team1: 0, team2: 0 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Right Tree */}
            <div className="flex gap-4 flex-row-reverse">
              {sideRounds.map(r => renderColumn(r, true))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
