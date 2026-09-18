'use client';

import { LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700"
    >
      <LogOut size={16} /> Sign Out
    </button>
  );
}
