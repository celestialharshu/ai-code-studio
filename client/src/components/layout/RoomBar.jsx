import { Link2, Lock, LogOut, Settings2 } from 'lucide-react';

import { cn } from '../../lib/cn.js';

const STATUS_LABEL = {
  connecting: 'connecting',
  connected: 'live',
  error: 'connection failed',
  offline: 'offline',
};

export default function RoomBar({ room, details, status, peers, user, onManage, onLeave }) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border bg-elevated px-4">
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            status === 'connected' && 'bg-accent',
            status === 'connecting' && 'bg-muted',
            status === 'error' && 'bg-danger',
          )}
        />
        {STATUS_LABEL[status]}
      </span>

      <span className="font-mono text-[11px] text-muted">room {room.id}</span>

      {details && (
        <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
          {details.access === 'private' ? <Lock size={11} /> : <Link2 size={11} />}
          {details.access === 'private' ? 'private' : 'link'}
        </span>
      )}

      <div className="ml-auto flex items-center gap-3">
        {/* Who's actually here right now — this comes from presence, not the member
            list, so it's the people with the tab open, not everyone invited. */}
        <div className="flex -space-x-1.5">
          <Avatar name={user.username} color={user.color} title={`${user.username} (you)`} />
          {peers.map((peer) => (
            <Avatar key={peer.clientId} name={peer.name} color={peer.color} title={peer.name} />
          ))}
        </div>

        {details && (
          <button
            onClick={onManage}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-text"
          >
            <Settings2 size={12} />
            Manage
          </button>
        )}

        <button
          onClick={onLeave}
          title="Leave the room and keep the code"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <LogOut size={12} />
          Leave
        </button>
      </div>
    </div>
  );
}

function Avatar({ name, color, title }) {
  return (
    <span
      title={title}
      style={{ backgroundColor: color }}
      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-elevated font-mono text-[10px] font-medium text-[#1C1917]"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
