'use client';

import { useState } from 'react';
import { castVote } from '@/app/actions/vote';

type Matchup = {
  id: string;
  round_number: number;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
};

interface MatchupCardProps {
  matchup: Matchup;
  isActive: boolean;
  isPast: boolean;
}

export default function MatchupCard({ matchup, isActive, isPast }: MatchupCardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t1 = matchup.team1_id;
  const t2 = matchup.team2_id;

  const handleVote = async (teamId: string) => {
    if (!isActive || !teamId || loading) return;
    
    setLoading(true);
    const result = await castVote(matchup.id, teamId);
    if (result.status === 'SUCCESS') {
      setSelectedTeam(teamId);
    } else {
      alert(result.message || 'Error voting');
    }
    setLoading(false);
  };

  const TeamRow = ({ teamId }: { teamId: string | null }) => {
    const isWinner = isPast && matchup.winner_id === teamId;
    const isSelected = selectedTeam === teamId;
    
    // UI logic for BYE
    if (!teamId) {
      return (
        <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 text-gray-400 italic text-sm">
          <span>TBD / BYE</span>
        </div>
      );
    }

    return (
      <div 
        onClick={() => handleVote(teamId)}
        className={`flex items-center justify-between p-3 border-b border-gray-100 transition-colors
          ${isActive ? 'cursor-pointer hover:bg-blue-50' : ''}
          ${isSelected ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''}
          ${isWinner ? 'bg-green-50 font-bold text-green-700' : ''}
          ${isPast && !isWinner ? 'opacity-50 line-through text-gray-500' : ''}
        `}
      >
        <span className="truncate">{teamId}</span>
        {isWinner && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Winner</span>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden text-sm flex flex-col">
      <TeamRow teamId={t1} />
      <TeamRow teamId={t2} />
    </div>
  );
}
