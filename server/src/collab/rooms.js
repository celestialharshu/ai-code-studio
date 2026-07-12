import * as Y from 'yjs';
import Room from '../models/Room.js';

/**
 * The live rooms — the ones with people in them right now.
 *
 * A room exists in two places. MongoDB holds the durable snapshot, so a room
 * survives a restart and a late joiner can be caught up without another client
 * being online. This Map holds the in-memory Y.Doc for the rooms currently in
 * use, because applying a CRDT update to a document you have to fetch from the
 * database first would be absurd on every keystroke.
 *
 * Nobody in the room -> flush to Mongo, drop it from memory.
 */
const live = new Map(); // roomId -> { doc, peers: Map<socketId, clientId>, saveTimer }

// At most one write per this interval while someone is typing continuously.
const SAVE_EVERY_MS = 2000;

export async function openRoom(roomId) {
  const existing = live.get(roomId);
  if (existing) return existing;

  const doc = new Y.Doc();

  // Rehydrate from the last snapshot, if there is one.
  const record = await Room.findOne({ roomId }).select('state');
  if (record?.state?.length) {
    Y.applyUpdate(doc, new Uint8Array(record.state), 'db');
  }

  const entry = { doc, peers: new Map(), saveTimer: null };
  live.set(roomId, entry);
  return entry;
}

export const getLiveRoom = (roomId) => live.get(roomId);

/**
 * Throttled, not debounced. A debounce would never fire while someone is typing
 * without pause — which is exactly when you most want the work saved.
 */
export function scheduleSave(roomId) {
  const entry = live.get(roomId);
  if (!entry || entry.saveTimer) return;

  entry.saveTimer = setTimeout(() => {
    entry.saveTimer = null;
    save(roomId).catch((err) => console.error('[rooms] save failed', err));
  }, SAVE_EVERY_MS);
}

export async function closeRoomIfEmpty(roomId) {
  const entry = live.get(roomId);
  if (!entry || entry.peers.size > 0) return;

  clearTimeout(entry.saveTimer);
  await save(roomId); // flush whatever the throttle was still holding
  entry.doc.destroy();
  live.delete(roomId);
}

async function save(roomId) {
  const entry = live.get(roomId);
  if (!entry) return;

  await Room.updateOne(
    { roomId },
    { $set: { state: Buffer.from(Y.encodeStateAsUpdate(entry.doc)) } },
  );
}
