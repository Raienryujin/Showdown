import { createClient } from '@/utils/supabase/server';
import CreateBracketForm from '@/components/CreateBracketForm';
import AuthForm from '@/components/AuthForm';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="text-center mb-12 max-w-3xl">
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full shadow-sm">
          Tournament Bracket Engine
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight sm:text-6xl mb-6">
          Showdown <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600">Maker</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          Create multi-tenant brackets, invite your friends, and vote asynchronously to declare the ultimate winner.
        </p>
      </div>

      {user ? (
        <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-full max-w-2xl mb-4 flex justify-between items-center px-2">
            <span className="text-sm font-medium text-slate-500">
              Logged in as <strong className="text-slate-800">{user.email}</strong>
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
