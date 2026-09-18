import { createClient } from '@/utils/supabase/server';
import CreateBracketForm from '@/components/CreateBracketForm';
import AuthForm from '@/components/AuthForm';
import Link from 'next/link';
import { Trophy, Calendar } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  // Fetch the latest 5 public brackets
  const { data: recentBrackets } = await supabase
    .from('brackets')
    .select('id, name, current_round, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="text-center mb-12 max-w-4xl w-full">
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm">
          Tournament Bracket Engine
        </div>
        <h1 className="text-5xl font-extrabold text-white tracking-tight sm:text-6xl mb-6">
          Showdown <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Maker</span>
        </h1>
        <p className="text-xl text-neutral-400 leading-relaxed mb-12">
          Create multi-tenant brackets, invite your friends, and vote asynchronously to declare the ultimate winner.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
          
          {/* Left Column: Creator / Auth */}
          <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            {user ? (
              <>
                <div className="w-full mb-4 flex justify-between items-center px-2">
                  <span className="text-sm font-medium text-neutral-500">
                    Logged in as <strong className="text-neutral-300">{user.email}</strong>
                  </span>
                </div>
                <CreateBracketForm />
              </>
            ) : (
              <AuthForm />
            )}
          </div>

          {/* Right Column: Public Directory */}
          <div className="w-full bg-[#121212] rounded-2xl shadow-2xl border border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="text-indigo-400" size={24} /> 
              Public Tournaments
            </h2>
            
            {recentBrackets && recentBrackets.length > 0 ? (
              <div className="space-y-4">
                {recentBrackets.map((bracket) => (
                  <Link 
                    key={bracket.id} 
                    href={`/bracket/${bracket.id}`}
                    className="block group"
                  >
                    <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/80 hover:border-indigo-500/30 transition-all duration-200">
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {bracket.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
                          Round {bracket.current_round}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(bracket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-neutral-500 text-sm p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 text-center">
                No public tournaments found. Log in and create the first one!
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
