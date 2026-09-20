'use client';

import { useState } from 'react';
import { castVote } from '@/app/actions/vote';
import { updateRoundOneMatchup } from '@/app/actions/bracket';
import { CheckCircle2, ShieldQuestion, Pencil, X, Check } from 'lucide-react';

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
  isCreator?: boolean;
  onMatchupUpdated?: () => void;
}

export default function MatchupCard({ matchup, isActive, isPast, isLoggedIn, initialVote, voteCounts, isCreator, onMatchupUpdated }: MatchupCardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(initialVote);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTeam1, setEditTeam1] = useState(matchup.team1_id || '');
  const [editTeam2, setEditTeam2] = useState(matchup.team2_id || '');
  const [savingEdit, setSavingEdit] = useState(false);

  const t1 = matchup.team1_id;
  const t2 = matchup.team2_id;

  const totalVotes = (voteCounts?.team1 || 0) + (voteCounts?.team2 || 0);

  const handleVote = async (teamId: string) => {
    if (!isActive || !teamId || loading || isEditing) return;
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

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    const result = await updateRoundOneMatchup(
      matchup.id,
      editTeam1.trim() || null,
      editTeam2.trim() || null
    );
    if (result.status === 'SUCCESS') {
      setIsEditing(false);
      onMatchupUpdated?.();
    } else {
      alert(result.message || 'Error updating matchup');
    }
    setSavingEdit(false);
  };

  if (isEditing) {
    return (
      <div className="bg-[#121212] rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-indigo-500/50 overflow-hidden flex flex-col w-full relative group">
        <div className="p-2 space-y-2 relative z-10">
          <input
            type="text"
            value={editTeam1}
            onChange={(e) => setEditTeam1(e.target.value)}
            className="w-full px-2 py-1 h-[32px] rounded-lg border border-neutral-700 bg-neutral-900 text-sm text-white focus:outline-none focus:border-indigo-500"
            placeholder="Team 1"
          />
          <input
            type="text"
            value={editTeam2}
            onChange={(e) => setEditTeam2(e.target.value)}
            className="w-full px-2 py-1 h-[32px] rounded-lg border border-neutral-700 bg-neutral-900 text-sm text-white focus:outline-none focus:border-indigo-500"
            placeholder="Team 2"
          />
        </div>
        <div className="absolute right-0 top-0 h-full flex flex-col justify-center items-center px-2 gap-2 bg-neutral-900/90 backdrop-blur-sm z-20">
          <button 
            onClick={handleSaveEdit}
            disabled={savingEdit}
            className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/30 disabled:opacity-50"
          >
            <Check size={16} />
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            disabled={savingEdit}
            className="p-1.5 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

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
      
      {/* Edit Button for Hosts */}
      {isCreator && matchup.round_number === 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="absolute -right-2 -top-2 p-1.5 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-400 hover:bg-neutral-700 z-30"
          title="Edit Matchup"
        >
          <Pencil size={14} />
        </button>
      )}

      <TeamRow teamId={t1} votes={voteCounts?.team1 || 0} />
      <TeamRow teamId={t2} isBottom votes={voteCounts?.team2 || 0} />
    </div>
  );
}
