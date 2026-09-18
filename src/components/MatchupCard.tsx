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
  isLoggedIn: boolean;
  initialVote: string | null;
}

export default function MatchupCard({ matchup, isActive, isPast, isLoggedIn, initialVote }: MatchupCardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(initialVote);
  const [loading, setLoading] = useState(false);

  const t1 = matchup.team1_id;
  const t2 = matchup.team2_id;

  const handleVote = async (teamId: string) => {
    if (!isActive || !teamId || loading) return;
    if (!isLoggedIn) {
      alert("You must be logged in to vote!");
      return;
    }
    
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
        <div className={`flex items-center justify-between p-3.5 bg-neutral-900/50 text-neutral-600 italic text-sm ${!isBottom ? 'border-b border-neutral-800' : ''}`}>
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
          ${!isBottom ? 'border-b border-neutral-800' : ''}
          ${isActive && isLoggedIn ? 'cursor-pointer hover:bg-neutral-800' : ''}
          ${isSelected ? 'bg-indigo-500/10 border-l-4 border-l-indigo-400' : 'border-l-4 border-l-transparent'}
          ${isWinner ? 'bg-emerald-500/10 font-bold text-emerald-400 border-l-emerald-500' : ''}
          ${isPast && !isWinner ? 'opacity-40 line-through text-neutral-500' : 'text-neutral-300'}
        `}
      >
        <span className="truncate font-medium">{teamId}</span>
        {isWinner && <CheckCircle2 size={16} className="text-emerald-500" />}
        {isSelected && !isWinner && <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
      </div>
    );
  };

  return (
    <div className="bg-[#121212] rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-neutral-800 overflow-hidden text-sm flex flex-col w-[260px] relative transition-transform hover:-translate-y-0.5 duration-200 group">
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-400 to-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
      )}
      <TeamRow teamId={t1} />
      <TeamRow teamId={t2} isBottom />
    </div>
  );
}
