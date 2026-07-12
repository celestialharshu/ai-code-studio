import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Link2, Lock, Plus } from 'lucide-react';

import { listRooms } from '../../lib/api.js';

/**
 * Rooms persist in MongoDB now, so you need a way back into them. Without this,
 * closing the tab means the room still exists but you can never find it again.
 */
export default function RoomsMenu({ onOpenRoom, onStartRoom }) {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    listRooms()
      .then((data) => setRooms(data.rooms))
      .catch(() => setRooms([]));

    const onClickAway = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    // A frame's delay, or the click that opened the menu also closes it.
    const timer = setTimeout(() => document.addEventListener('click', onClickAway));

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', onClickAway);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted transition-colors hover:border-accent hover:text-text"
      >
        Rooms
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-border bg-surface py-1.5">
          <button
            onClick={() => {
              setOpen(false);
              onStartRoom();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-elevated"
          >
            <Plus size={13} className="text-accent-text" />
            Start a new room
          </button>

          {rooms.length > 0 && <div className="my-1.5 border-t border-border" />}

          {rooms.map((room) => (
            <button
              key={room.roomId}
              onClick={() => {
                setOpen(false);
                onOpenRoom(room.roomId);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-elevated"
            >
              {room.access === 'private' ? (
                <Lock size={12} className="shrink-0 text-muted" />
              ) : (
                <Link2 size={12} className="shrink-0 text-muted" />
              )}

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs">{room.name}</span>
                <span className="block font-mono text-[10px] text-muted">
                  {room.roomId} · {room.members.length} {room.members.length === 1 ? 'member' : 'members'}
                </span>
              </span>

              {room.isOwner && (
                <span className="shrink-0 font-mono text-[10px] text-muted">yours</span>
              )}
            </button>
          ))}

          {rooms.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-muted">No rooms yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
