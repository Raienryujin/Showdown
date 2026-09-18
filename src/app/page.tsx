import { createClient } from '@/utils/supabase/server';
import CreateBracketForm from '@/components/CreateBracketForm';
import AuthForm from '@/components/AuthForm';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="text-center mb-12 max-w-3xl">
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm">
          Tournament Bracket Engine
        </div>
        <h1 className="text-5xl font-extrabold text-white tracking-tight sm:text-6xl mb-6">
          Showdown <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Maker</span>
        </h1>
        <p className="text-xl text-neutral-400 leading-relaxed">
          Create multi-tenant brackets, invite your friends, and vote asynchronously to declare the ultimate winner.
        </p>
      </div>

      {user ? (
        <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-full max-w-2xl mb-4 flex justify-between items-center px-2">
            <span className="text-sm font-medium text-neutral-500">
              Logged in as <strong className="text-neutral-300">{user.email}</strong>
            </span>
          </div>
          <CreateBracketForm />
        </div>
      ) : (
        <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AuthForm />
        </div>
      )}
      
    </main>
  );
}
