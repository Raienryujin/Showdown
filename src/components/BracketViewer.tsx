'use client';

import { useState } from 'react';
import MatchupCard from './MatchupCard';
import { endRound } from '@/app/actions/bracket';

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
}

export default function BracketViewer({ bracket, matchups, isCreator }: BracketViewerProps) {
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
      setError(`Tie detected in matchups: ${result.tiedMatchups?.join(', ')}. Manual resolution required (not built yet!).`);
    } else {
      // Success, refresh page
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {isCreator && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleEndRound}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : `End Round ${bracket.current_round}`}
          </button>
        </div>
      )}

      <div className="flex gap-8 min-w-max pb-4">
        {rounds.map(roundNum => {
          const roundMatchups = matchups.filter(m => m.round_number === roundNum);
          const isCurrentRound = roundNum === bracket.current_round;
          const isPastRound = roundNum < bracket.current_round;

          return (
            <div key={roundNum} className="flex flex-col gap-6 min-w-[250px]">
              <h3 className="text-center font-bold text-gray-700 mb-2">
                Round {roundNum}
              </h3>
              
              <div className="flex flex-col gap-4 flex-1 justify-around">
                {roundMatchups.map(matchup => (
                  <MatchupCard
                    key={matchup.id}
                    matchup={matchup}
                    isActive={isCurrentRound}
                    isPast={isPastRound}
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
