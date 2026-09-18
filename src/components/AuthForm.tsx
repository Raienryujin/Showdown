'use client';

import { useState } from 'react';
import { login, signup } from '@/app/actions/auth';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const action = isLogin ? login : signup;
    
    const result = await action(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.message) {
      setMessage(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-[#121212] rounded-2xl shadow-2xl border border-neutral-800 p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-sm text-neutral-400 mt-2">
          {isLogin ? 'Enter your details to access your tournaments.' : 'Join the platform to host your own showdowns.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-medium">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email address</label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-neutral-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white bg-neutral-900 placeholder-neutral-600 shadow-inner"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
          <input
            name="password"
            type="password"
            required
            className="w-full px-4 py-3 rounded-xl border border-neutral-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white bg-neutral-900 placeholder-neutral-600 shadow-inner"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? (
            <span className="animate-pulse">Processing...</span>
          ) : isLogin ? (
            <>
              <LogIn size={18} /> Sign In
            </>
          ) : (
            <>
              <UserPlus size={18} /> Sign Up
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-neutral-400 hover:text-white font-medium transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
