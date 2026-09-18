'use client';

import { useState } from 'react';
import { castVote } from '@/app/actions/vote';
import { CheckCircle2, ShieldQuestion } from 'lucide-react';

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

  const TeamRow = ({ teamId, isBottom }: { teamId: string | null, isBottom?: boolean }) => {
    const isWinner = isPast && matchup.winner_id === teamId;
    const isSelected = selectedTeam === teamId;
    
    if (!teamId) {
      return (
        <div className={`flex items-center justify-between p-3.5 bg-gray-50/50 text-gray-400 italic text-sm ${!isBottom ? 'border-b border-gray-100' : ''}`}>
          <span className="flex items-center gap-2">
            <ShieldQuestion size={16} className="opacity-50" />
            TBD / BYE
          </span>
        </div>
      );
    }

    return (
      <div 
        onClick={() => handleVote(teamId)}
        className={`flex items-center justify-between p-3.5 transition-all
          ${!isBottom ? 'border-b border-gray-100' : ''}
          ${isActive ? 'cursor-pointer hover:bg-indigo-50/50' : ''}
          ${isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}
          ${isWinner ? 'bg-emerald-50/50 font-bold text-emerald-900 border-l-emerald-500' : ''}
          ${isPast && !isWinner ? 'opacity-40 line-through text-gray-500' : 'text-gray-700'}
        `}
      >
        <span className="truncate font-medium">{teamId}</span>
        {isWinner && <CheckCircle2 size={16} className="text-emerald-600" />}
        {isSelected && !isWinner && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-200 overflow-hidden text-sm flex flex-col w-[260px] relative transition-transform hover:-translate-y-0.5 duration-200">
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-400 to-purple-500" />
      )}
      <TeamRow teamId={t1} />
      <TeamRow teamId={t2} isBottom />
    </div>
  );
}
