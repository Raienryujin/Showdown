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

  // Group matchups by round
  const maxRound = Math.max(...matchups.map(m => m.round_number));
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  const handleEndRound = async () => {
    setLoading(true);
    setError('');
    
    const result = await endRound(bracket.id);
    
    if (result.status === 'ERROR') {
      setError(result.message || 'Failed to end round.');
    } else if (result.status === 'TIE_DETECTED') {
      setError(`Tie detected in matchups. Manual resolution required (feature pending).`);
    } else {
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
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
