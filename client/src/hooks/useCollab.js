import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness';
import { MonacoBinding } from 'y-monaco';

import { applyRemoteCursorStyles, clearRemoteCursorStyles } from '../lib/remoteCursors.js';
import { getToken } from '../lib/token.js';

const SERVER_URL = import.meta.env.VITE_API_URL || window.location.origin;

/**
 * Live collaborative editing.
 *
 * Two independent streams of information:
 *
 *   the document   a Y.Text. Yjs turns every edit into a CRDT update, so two
 *                  people typing in the same spot at the same time converge on
 *                  the same result instead of overwriting each other. We never
 *                  merge anything by hand.
 *
 *   presence       an Awareness instance. Cursors, names, colours. Deliberately
 *                  not part of the document — it's throwaway state that should
 *                  disappear when you close the tab, not history.
 *
 * MonacoBinding is the glue: it turns Monaco edits into Y.Text updates and back.
 * Because it works at the level of the editor's model, code that the AI writes
 * into the editor syncs to your collaborator for free — no extra wiring.
 *
 * @param room    { id, seed } — seed is true only for the person who just created it
 * @param editor  the Monaco instance, once it has mounted
 * @param user    the signed-in account: { username, color }
 */
export function useCollab({ room, editor, user }) {
  const [status, setStatus] = useState('offline'); // offline | connecting | connected | error
  const [error, setError] = useState(null);
  const [peers, setPeers] = useState([]);

  const awarenessRef = useRef(null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // No room, or the editor hasn't mounted yet — nothing to connect.
    if (!room?.id || !editor) {
      setStatus('offline');
      setPeers([]);
      setError(null);
      return;
    }

    setStatus('connecting');
    setError(null);

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('monaco');
    const awareness = new Awareness(ydoc);
    awarenessRef.current = awareness;
    awareness.setLocalStateField('user', {
      name: userRef.current.username,
      color: userRef.current.color,
    });

    // The server rejects the handshake outright without a valid token, so a
    // private room can't be opened by anyone who merely guessed its id.
    const socket = io(SERVER_URL, { auth: { token: getToken() } });
    let binding = null;

    // ---------------------------------------------------------------- document

    socket.on('connect', () => {
      socket.emit('room:join', { room: room.id, clientId: ydoc.clientID });
    });

    socket.on('doc:sync', (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'server');

      // A room you just created starts empty. Carry the code you already had
      // in the editor into it, so starting a room doesn't wipe your work.
      if (room.seed && ytext.length === 0) {
        ytext.insert(0, editor.getValue());
      }

      // Bind only now, not on mount. MonacoBinding overwrites the editor with
      // the shared document the moment it's constructed, so it has to be able
      // to see the real one.
      binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]), awareness);
      setStatus('connected');
    });

    socket.on('doc:update', (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
    });

    // Everything we do locally — typing, and anything the AI writes — goes out.
    const onDocUpdate = (update, origin) => {
      if (origin === 'remote' || origin === 'server') return; // don't echo back what we just received
      socket.emit('doc:update', update);
    };
    ydoc.on('update', onDocUpdate);

    // ---------------------------------------------------------------- presence

    socket.on('awareness:update', (update) => {
      applyAwarenessUpdate(awareness, new Uint8Array(update), 'remote');
    });

    const onAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin === 'remote') return;
      socket.emit('awareness:update', encodeAwarenessUpdate(awareness, [...added, ...updated, ...removed]));
    };
    awareness.on('update', onAwarenessUpdate);

    // Someone new arrived and can't see us yet — announce ourselves.
    socket.on('peer:joined', () => {
      socket.emit('awareness:update', encodeAwarenessUpdate(awareness, [ydoc.clientID]));
    });

    // Someone left — drop their cursor now rather than waiting for it to time out.
    socket.on('peer:left', (clientId) => {
      removeAwarenessStates(awareness, [clientId], 'remote');
    });

    // The peer list and the remote cursors are both just views of awareness, so
    // they're recomputed together and can never disagree.
    const onAwarenessChange = () => {
      const others = [];

      awareness.getStates().forEach((state, clientId) => {
        if (clientId !== ydoc.clientID && state.user) others.push({ clientId, ...state.user });
      });

      setPeers(others);
      applyRemoteCursorStyles(awareness);
    };
    awareness.on('change', onAwarenessChange);

    // The room refused us: it doesn't exist, or it's private and we're not on
    // the member list.
    socket.on('room:error', (message) => {
      setStatus('error');
      setError(message);
    });

    socket.on('connect_error', (err) => {
      setStatus('error');
      setError(err.message === 'unauthorized' ? 'Your session expired. Sign in again.' : 'Could not reach the server.');
    });

    // ----------------------------------------------------------------- cleanup

    return () => {
      socket.emit('room:leave');

      binding?.destroy();
      ydoc.off('update', onDocUpdate);
      awareness.off('update', onAwarenessUpdate);
      awareness.off('change', onAwarenessChange);
      awareness.destroy();
      ydoc.destroy();
      socket.disconnect();

      clearRemoteCursorStyles();
      awarenessRef.current = null;
    };
  }, [room?.id, room?.seed, editor]);

  // Renaming yourself shouldn't tear down the socket — just update presence in
  // place, and everyone's cursor label follows.
  useEffect(() => {
    awarenessRef.current?.setLocalStateField('user', { name: user.username, color: user.color });
  }, [user]);

  return { status, error, peers };
}
