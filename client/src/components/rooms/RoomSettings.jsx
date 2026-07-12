import { useState } from 'react';
import { Check, Link2, Lock, UserPlus, X } from 'lucide-react';

import Modal from '../ui/Modal.jsx';
import { inviteMember, removeMember, setRoomAccess } from '../../lib/api.js';
import { inviteLink } from '../../lib/room.js';
import { cn } from '../../lib/cn.js';

export default function RoomSettings({ room, onChange, onClose }) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPrivate = room.access === 'private';

  const run = async (action) => {
    setBusy(true);
    setError(null);

    try {
      const { room: updated } = await action();
      onChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const invite = async (event) => {
    event.preventDefault();
    if (!identifier.trim()) return;

    await run(() => inviteMember(room.roomId, identifier));
    setIdentifier('');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink(room.roomId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal title="Room settings" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Who can get in */}
        <div>
          <p className="text-xs font-medium">Who can open this room</p>

          <div className="mt-2 flex gap-2">
            <AccessOption
              icon={Lock}
              label="Private"
              detail="Only invited people"
              active={isPrivate}
              disabled={!room.isOwner || busy}
              onClick={() => run(() => setRoomAccess(room.roomId, 'private'))}
            />
            <AccessOption
              icon={Link2}
              label="Anyone with the link"
              detail="Must still be signed in"
              active={!isPrivate}
              disabled={!room.isOwner || busy}
              onClick={() => run(() => setRoomAccess(room.roomId, 'link'))}
            />
          </div>

          {!room.isOwner && (
            <p className="mt-2 text-[11px] text-muted">Only the owner can change this.</p>
          )}
        </div>

        {/* The link */}
        <button
          onClick={copyLink}
          className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2.5 text-left transition-colors hover:border-accent"
        >
          <span className="truncate font-mono text-[11px] text-muted">{inviteLink(room.roomId)}</span>
          <span className="ml-3 flex shrink-0 items-center gap-1.5 text-[11px] text-accent-text">
            {copied ? <Check size={12} /> : <Link2 size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>

        {/* Invite */}
        {room.isOwner && (
          <form onSubmit={invite}>
            <p className="text-xs font-medium">Invite someone</p>

            <div className="mt-2 flex gap-2">
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Their email or username"
                className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !identifier.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <UserPlus size={13} />
                Invite
              </button>
            </div>
          </form>
        )}

        {/* Members */}
        <div>
          <p className="text-xs font-medium">
            In this room · {room.members.length}
          </p>

          <ul className="mt-2 flex flex-col gap-1">
            {room.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-elevated"
              >
                <span
                  style={{ backgroundColor: member.color }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium text-[#1C1917]"
                >
                  {member.username.charAt(0).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs">{member.username}</span>
                  <span className="block truncate text-[11px] text-muted">{member.email}</span>
                </span>

                {member.id === room.ownerId ? (
                  <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">
                    owner
                  </span>
                ) : (
                  room.isOwner && (
                    <button
                      onClick={() => run(() => removeMember(room.roomId, member.id))}
                      disabled={busy}
                      aria-label={`Remove ${member.username}`}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-surface hover:text-danger"
                    >
                      <X size={13} />
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function AccessOption({ icon: Icon, label, detail, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-60',
        active ? 'border-accent bg-accent/10' : 'border-border hover:border-muted',
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <Icon size={13} className={active ? 'text-accent-text' : 'text-muted'} />
        {label}
      </span>
      <span className="mt-0.5 block text-[11px] text-muted">{detail}</span>
    </button>
  );
}
