'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteBracket } from '@/app/actions/bracket';
import { Trash2, ExternalLink, Calendar, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Bracket = {
  id: string;
  name: string;
  current_round: number;
  created_at: string;
};

export default function MyBracketsList({ brackets }: { brackets: Bracket[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingId(id);
    setError('');
    
    const result = await deleteBracket(id);
    if (result.status === 'ERROR') {
      setError(result.message || 'Failed to delete bracket');
      setDeletingId(null);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <h2 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-2">
        My Dashboard
      </h2>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/20 flex items-center gap-2">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}

      {brackets.length === 0 ? (
        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-8 text-center">
          <p className="text-neutral-500 text-sm">You haven't created any tournaments yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {brackets.map((bracket) => (
            <div 
              key={bracket.id}
              className="group bg-[#121212] border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
            >
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {bracket.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                    Round {bracket.current_round}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(bracket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link 
                  href={`/bracket/${bracket.id}`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-colors border border-neutral-800 text-sm font-medium"
                >
                  <ExternalLink size={16} /> Open
                </Link>
                <button
                  onClick={() => handleDelete(bracket.id, bracket.name)}
                  disabled={deletingId === bracket.id}
                  className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Tournament"
                >
                  {deletingId === bracket.id ? (
                    <span className="animate-pulse text-red-400 font-medium text-sm px-2">Deleting...</span>
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
