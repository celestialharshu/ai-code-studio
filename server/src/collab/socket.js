import * as Y from 'yjs';

import Room from '../models/Room.js';
import { verifyToken } from '../services/token.js';
import { closeRoomIfEmpty, getLiveRoom, openRoom, scheduleSave } from './rooms.js';

/**
 * The collaboration transport.
 *
 * Yjs does the hard part. Every edit becomes a CRDT update that can be applied
 * in any order and still converge, so this layer never has to understand an edit
 * or resolve a conflict — it only moves opaque binary blobs between the people
 * in a room.
 *
 *   doc:*        the document. Applied to the server's copy, relayed, saved.
 *   awareness:*  presence — cursors, names, colours. Relayed, never stored.
 *   peer:*       arrivals and departures.
 */
export function attachCollab(io) {
  /**
   * The websocket needs the same lock as the REST API. Without this, guessing a
   * six-character room id would be enough to read and edit someone's private
   * document — the access check on GET /api/rooms/:id would be decorative.
   */
  io.use((socket, next) => {
    const payload = verifyToken(socket.handshake.auth?.token);
    if (!payload) return next(new Error('unauthorized'));

    socket.user = { id: payload.sub, username: payload.username, color: payload.color };
    next();
  });

  io.on('connection', (socket) => {
    let roomId = null;
    let clientId = null; // the peer's Yjs client id, not their socket id

    socket.on('room:join', async ({ room, clientId: id }) => {
      try {
        const record = await Room.findOne({ roomId: room });

        if (!record) return socket.emit('room:error', 'That room does not exist.');
        if (!record.allows(socket.user.id)) {
          return socket.emit('room:error', 'This room is private. Ask the owner to invite you.');
        }

        // Walking in through a link earns you a place on the member list, so you
        // keep access even if the owner later switches the room back to private.
        if (!record.members.some((member) => String(member) === socket.user.id)) {
          record.members.push(socket.user.id);
          await record.save();
        }

        roomId = room;
        clientId = id;
        socket.join(roomId);

        const { doc, peers } = await openRoom(roomId);
        peers.set(socket.id, clientId);

        // Catch the newcomer up: the whole document as one binary update.
        socket.emit('doc:sync', Y.encodeStateAsUpdate(doc));

        // Tell everyone already here to re-announce themselves, so the newcomer
        // sees their cursors immediately rather than waiting for the awareness
        // protocol's next heartbeat.
        socket.to(roomId).emit('peer:joined');
      } catch (err) {
        console.error('[collab] join failed', err);
        socket.emit('room:error', 'Could not open that room.');
      }
    });

    socket.on('doc:update', (update) => {
      const live = roomId && getLiveRoom(roomId);
      if (!live) return;

      Y.applyUpdate(live.doc, new Uint8Array(update)); // keep the server copy current
      socket.to(roomId).emit('doc:update', update); // pass it on to everyone else
      scheduleSave(roomId); // and get it into Mongo before long
    });

    socket.on('awareness:update', (update) => {
      if (!roomId) return;
      socket.to(roomId).emit('awareness:update', update);
    });

    socket.on('room:leave', leave);
    socket.on('disconnect', leave);

    async function leave() {
      if (!roomId) return;

      const closing = roomId;
      roomId = null;

      getLiveRoom(closing)?.peers.delete(socket.id);

      // Without this the departed peer's cursor would linger in everyone else's
      // editor until the awareness timeout eventually expired it.
      socket.to(closing).emit('peer:left', clientId);
      socket.leave(closing);

      await closeRoomIfEmpty(closing);
    }
  });
}
