'use client';

import { useState } from 'react';
import MatchupCard from './MatchupCard';
import { endRound } from '@/app/actions/bracket';
import { PlayCircle, ShieldAlert } from 'lucide-react';

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
}

export default function BracketViewer({ bracket, matchups, isCreator, isLoggedIn, userVotes }: BracketViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Tie-Breaker State
  const [tiedMatchupIds, setTiedMatchupIds] = useState<string[]>([]);
  const [tieOverrides, setTieOverrides] = useState<Record<string, string>>({});

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

      <div className="flex gap-12 min-w-max pb-8 pt-4 items-center justify-start overflow-x-auto">
        {rounds.map(roundNum => {
          const roundMatchups = matchups.filter(m => m.round_number === roundNum);
          const isCurrentRound = roundNum === bracket.current_round;
          const isPastRound = roundNum < bracket.current_round;

          return (
            <div key={roundNum} className="flex flex-col gap-8 min-w-[260px]">
              <div className="text-center mb-2">
                <span className={`text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full ${
                  isCurrentRound 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                    : isPastRound 
                      ? 'bg-neutral-800 text-neutral-500 border border-neutral-700' 
                      : 'bg-neutral-900 text-neutral-600 border border-neutral-800'
                }`}>
                  Round {roundNum}
                </span>
              </div>
              
              <div className="flex flex-col gap-6 flex-1 justify-around">
                {roundMatchups.map(matchup => (
                  <MatchupCard
                    key={matchup.id}
                    matchup={matchup}
                    isActive={isCurrentRound}
                    isPast={isPastRound}
                    isLoggedIn={isLoggedIn}
                    initialVote={userVotes[matchup.id] || null}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
