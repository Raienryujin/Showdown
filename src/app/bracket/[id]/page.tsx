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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Error loading bracket matchups
      </div>
    );
  }

  const { data: authData } = await supabase.auth.getUser();
  const isCreator = authData?.user?.id === bracket.creator_id;

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-[1400px] mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-8">
          <Home size={16} /> Back to Dashboard
        </Link>

        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{bracket.name}</h1>
            <p className="text-slate-500 mt-2 font-medium">Tournament Stage: <span className="text-indigo-600">Round {bracket.current_round}</span></p>
          </div>
          {isCreator && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm border border-indigo-400/30">
              Host / Creator Mode
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-x-auto relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
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
