'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBracket } from '@/app/actions/bracket';
import { Plus, Trash2, Trophy } from 'lucide-react';

export default function CreateBracketForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [teams, setTeams] = useState<string[]>(['', '']); // start with 2 empty teams
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
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 w-full max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" /> Create New Tournament
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bracket Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g. Summer Code Showdown 2026"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
          <div className="space-y-3">
            {teams.map((team, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-gray-400 font-mono text-sm w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => updateTeam(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={`Team ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeTeam(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
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
            className="mt-3 flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors"
          >
            <Plus size={16} /> Add another team
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating Bracket Tree...' : 'Create Bracket'}
        </button>
      </form>
    </div>
  );
}
