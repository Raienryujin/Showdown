import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import BracketViewer from '@/components/BracketViewer';

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
    return <div>Error loading bracket matchups</div>;
  }

  // Determine if the current viewer is the creator
  const { data: authData } = await supabase.auth.getUser();
  const isCreator = authData?.user?.id === bracket.creator_id;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{bracket.name}</h1>
            <p className="text-gray-500 mt-2">Current Round: {bracket.current_round}</p>
          </div>
          {isCreator && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              Creator Mode
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
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
