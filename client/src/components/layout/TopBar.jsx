import { Braces, LogOut } from 'lucide-react';

import RoomsMenu from '../rooms/RoomsMenu.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';

export default function TopBar({ onOpenRoom, onStartRoom }) {
  const { user, signOut } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Braces size={17} strokeWidth={2.5} className="text-accent-fg" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-tight">AI Pair Programmer</h1>
          <p className="text-xs text-muted">Editor + AI chat</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted xl:inline">
          groq · llama-3.3-70b
        </span>

        <RoomsMenu onOpenRoom={onOpenRoom} onStartRoom={onStartRoom} />

        <span className="mx-1 flex items-center gap-2">
          <span
            style={{ backgroundColor: user.color }}
            title={user.email}
            className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-medium text-[#1C1917]"
          >
            {user.username.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-xs text-muted sm:inline">{user.username}</span>
        </span>

        <button
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-elevated hover:text-text"
        >
          <LogOut size={15} />
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
