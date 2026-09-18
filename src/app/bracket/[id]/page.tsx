import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import BracketViewer from '@/components/BracketViewer';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bracket, error: bracketError } = await supabase
    .from('brackets')
    .select('*')
    .eq('id', id)
    .single();

  if (bracketError || !bracket) {
    notFound();
  }

  const { data: matchups, error: matchupsError } = await supabase
    .from('matchups')
    .select('*')
    .eq('bracket_id', bracket.id)
    .order('round_number', { ascending: true });

  if (matchupsError || !matchups) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-neutral-400">
        Error loading bracket matchups
      </div>
    );
  }

  const { data: authData } = await supabase.auth.getUser();
  const isCreator = authData?.user?.id === bracket.creator_id;

  return (
    <main className="min-h-screen bg-[#0A0A0A] p-6 sm:p-10 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="max-w-[1400px] mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-indigo-400 transition-colors mb-8">
          <Home size={16} /> Back to Dashboard
        </Link>

        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{bracket.name}</h1>
            <p className="text-neutral-400 mt-2 font-medium">Tournament Stage: <span className="text-indigo-400">Round {bracket.current_round}</span></p>
          </div>
          {isCreator && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
              Host / Creator Mode
            </div>
          )}
        </div>

        <div className="bg-[#121212] p-8 rounded-2xl shadow-2xl border border-neutral-800 overflow-x-auto relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
          <BracketViewer 
            bracket={bracket} 
            matchups={matchups} 
            isCreator={isCreator} 
          />
        </div>
      </div>
    </main>
  );
}
