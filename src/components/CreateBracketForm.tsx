'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBracket } from '@/app/actions/bracket';
import { Plus, Trash2, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default function CreateBracketForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [teams, setTeams] = useState<string[]>(['', '']); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTeam = () => {
    setTeams([...teams, '']);
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
    if (validTeams.length < 2) {
      setError('You need at least 2 teams to create a bracket.');
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
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
      
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Trophy size={20} />
          </div>
          Create Tournament
        </h2>
        
        <button 
          onClick={() => logout()} 
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Bracket Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white"
            placeholder="e.g. Summer Code Showdown 2026"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">Contenders</label>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
              {teams.length} Slots
            </span>
          </div>
          
          <div className="space-y-3">
            {teams.map((team, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <span className="text-gray-400 font-mono text-sm w-6 text-right select-none">{index + 1}.</span>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => updateTeam(index, e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder={`Team ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeTeam(index)}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-50 group-hover:opacity-100 disabled:opacity-30"
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
            className="mt-4 flex items-center gap-2 text-sm text-emerald-600 font-semibold hover:text-emerald-700 hover:bg-emerald-50 py-2 px-3 rounded-lg transition-all"
          >
            <Plus size={16} /> Add Contender
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
