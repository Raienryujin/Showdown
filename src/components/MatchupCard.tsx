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
  voteCounts?: { team1: number, team2: number };
}

export default function MatchupCard({ matchup, isActive, isPast, isLoggedIn, initialVote, voteCounts }: MatchupCardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(initialVote);
  const [loading, setLoading] = useState(false);

  const t1 = matchup.team1_id;
  const t2 = matchup.team2_id;

  const totalVotes = (voteCounts?.team1 || 0) + (voteCounts?.team2 || 0);

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

  const TeamRow = ({ teamId, isBottom, votes }: { teamId: string | null, isBottom?: boolean, votes: number }) => {
    const isWinner = isPast && matchup.winner_id === teamId;
    const isSelected = selectedTeam === teamId;
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    
    if (!teamId) {
      return (
        <div className={`flex items-center justify-between px-3.5 h-[44px] bg-neutral-900/50 text-neutral-600 italic text-base ${!isBottom ? 'border-b border-neutral-800' : ''}`}>
          <span className="flex items-center gap-2.5">
            <ShieldQuestion size={18} className="opacity-50" />
            <span className="truncate">TBD / BYE</span>
          </span>
        </div>
      );
    }

    return (
      <div 
        onClick={() => handleVote(teamId)}
        className={`relative flex items-center justify-between px-3.5 h-[44px] text-base transition-all overflow-hidden
          ${!isBottom ? 'border-b border-neutral-800' : ''}
          ${isActive && isLoggedIn ? 'cursor-pointer hover:bg-neutral-800' : ''}
          ${isSelected ? 'bg-indigo-500/10 border-l-4 border-l-indigo-400' : 'border-l-4 border-l-transparent'}
          ${isWinner ? 'bg-emerald-500/10 text-emerald-400 border-l-emerald-500' : ''}
          ${isPast && !isWinner ? 'opacity-40 line-through text-neutral-500' : 'text-neutral-300'}
        `}
      >
        {/* Live Vote Progress Bar Background */}
        {isActive && totalVotes > 0 && (
          <div 
            className="absolute top-0 left-0 h-full bg-neutral-800/40 transition-all duration-700 ease-in-out" 
            style={{ width: `${percentage}%` }}
          />
        )}

        <div className="flex items-center justify-between w-full relative z-10">
          <span className="truncate font-semibold pr-2">{teamId}</span>
          <div className="flex items-center gap-2.5 shrink-0">
            {isActive && totalVotes > 0 && (
              <span className="text-sm font-bold text-neutral-400">{percentage}%</span>
            )}
            {isWinner && <CheckCircle2 size={18} className="text-emerald-500" />}
            {isSelected && !isWinner && <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#121212] rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-neutral-800 overflow-hidden flex flex-col w-full relative transition-transform hover:-translate-y-0.5 duration-200 group">
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-400 to-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity z-20" />
      )}
      <TeamRow teamId={t1} votes={voteCounts?.team1 || 0} />
      <TeamRow teamId={t2} isBottom votes={voteCounts?.team2 || 0} />
    </div>
  );
}
