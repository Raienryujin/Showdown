'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBracket } from '@/app/actions/bracket';
import { Plus, Trash2, Trophy, ArrowRight, Loader2 } from 'lucide-react';

export default function CreateBracketForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [teams, setTeams] = useState<string[]>(['', '']); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTeam = () => {
    if (teams.length < 64) {
      setTeams([...teams, '']);
    }
  };

  const removeTeam = (index: number) => {
    const newTeams = teams.filter((_, i) => i !== index);
    setTeams(newTeams);
  };

  const updateTeam = (index: number, value: string) => {
    const newTeams = [...teams];
    newTeams[index] = value;
    setTeams(newTeams);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validTeams = teams.map((t) => t.trim()).filter((t) => t.length > 0);
    
    // Strict power-of-2 enforcement (2, 4, 8, 16, 32, 64)
    const allowedSizes = [2, 4, 8, 16, 32, 64];
    if (!allowedSizes.includes(validTeams.length)) {
      setError(`Tournament size must be 2, 4, 8, 16, 32, or 64 teams for a perfect bracket (you have ${validTeams.length}).`);
      return;
    }

    if (!name.trim()) {
      setError('Please provide a bracket name.');
      return;
    }

    setLoading(true);
    try {
      const result = await createBracket(name, validTeams);
      if (result.status === 'ERROR') {
        setError(result.message || 'Failed to create bracket.');
        setLoading(false);
      } else if (result.status === 'SUCCESS' && result.bracketId) {
        router.push(`/bracket/${result.bracketId}`);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-[#121212] rounded-2xl shadow-2xl border border-neutral-800 p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500" />
      
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <Trophy size={20} />
          </div>
          Create Tournament
        </h2>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-300 mb-2">Bracket Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-800 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-white bg-neutral-900 placeholder-neutral-600 shadow-inner"
            placeholder="e.g. Summer Code Showdown 2026"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-neutral-300">Contenders</label>
            <span className={`text-xs font-medium px-2 py-1 rounded-md border ${
              teams.length === 64 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}>
              {teams.length} / 64 Slots
            </span>
          </div>
          
          <div className="space-y-3">
            {teams.map((team, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <span className="text-neutral-500 font-mono text-sm w-6 text-right select-none">{index + 1}.</span>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => updateTeam(index, e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-800 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-white bg-neutral-900 placeholder-neutral-600 shadow-inner"
                  placeholder={`Team ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeTeam(index)}
                  className="p-2.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-50 group-hover:opacity-100 disabled:opacity-30"
                  disabled={teams.length <= 2}
                  title="Remove team"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTeam}
            disabled={teams.length >= 64}
            className="mt-4 flex items-center gap-2 text-sm text-emerald-400 font-semibold hover:text-emerald-300 hover:bg-emerald-500/10 py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Add Contender
          </button>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 border border-emerald-400/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Generating Graph...
              </>
            ) : (
              <>
                Generate Bracket <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
