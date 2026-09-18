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
    <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {isLogin ? 'Enter your details to access your tournaments.' : 'Join the platform to host your own showdowns.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-100 text-sm text-green-600 font-medium">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input
            name="password"
            type="password"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
