import { useCallback, useEffect, useState } from 'react';

import TopBar from './components/layout/TopBar.jsx';
import RoomBar from './components/layout/RoomBar.jsx';
import StatusBar from './components/layout/StatusBar.jsx';
import SplitPane from './components/layout/SplitPane.jsx';
import EditorPane from './components/editor/EditorPane.jsx';
import ChatPanel from './components/chat/ChatPanel.jsx';
import RoomSettings from './components/rooms/RoomSettings.jsx';

import { useAuth } from './auth/AuthProvider.jsx';
import { useChat } from './hooks/useChat.js';
import { useCollab } from './hooks/useCollab.js';
import { useRunner } from './hooks/useRunner.js';
import { createRoom, fetchRoom } from './lib/api.js';
import { firstCodeBlock } from './lib/parseMessage.js';
import { STARTERS, normalizeLanguage } from './lib/languages.js';
import { readRoomFromUrl, writeRoomToUrl } from './lib/room.js';

/**
 * The app once you're signed in.
 *
 * It holds the wiring, not the document. The code itself lives in Monaco's model
 * — see CodeEditor for why. What lives here is everything *around* the code:
 * which language is selected, the conversation, the run output, and which room
 * we're in.
 */
export default function Workspace() {
  const { user } = useAuth();

  const [editor, setEditor] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [autoApply, setAutoApply] = useState(true);
  const [flash, setFlash] = useState(null);

  // `seed` is true only for the person who just created the room — they're the
  // one whose current code becomes the room's starting document.
  const [room, setRoom] = useState(() => {
    const id = readRoomFromUrl();
    return id ? { id, seed: false } : null;
  });

  const [details, setDetails] = useState(null); // access, members, isOwner
  const [denied, setDenied] = useState(null);
  const [managing, setManaging] = useState(false);

  // Ask the server about the room before connecting. A private room you weren't
  // invited to should say so plainly, not fail as a mysterious socket error.
  useEffect(() => {
    if (!room?.id) {
      setDetails(null);
      setDenied(null);
      return;
    }

    fetchRoom(room.id)
      .then((data) => {
        setDetails(data.room);
        setDenied(null);
      })
      .catch((err) => {
        setDetails(null);
        setDenied(err.message);
      });
  }, [room?.id]);

  const collab = useCollab({ room: denied ? null : room, editor, user });

  const onEditorReady = useCallback((instance) => setEditor(instance), []);

  /** A short-lived note in the status bar, e.g. after the AI writes some code. */
  const flashMessage = useCallback((message) => {
    setFlash(message);
    setTimeout(() => setFlash(null), 2500);
  }, []);

  // --------------------------------------------------------------- the editor

  /**
   * Swap the whole file for the model's code.
   *
   * This goes through executeEdits rather than setValue, so it lands on Monaco's
   * undo stack and Ctrl/Cmd+Z brings your old code back. That safety net is what
   * makes auto-apply reasonable rather than reckless. And because it's an
   * ordinary model edit, everyone else in the room watches it appear in their
   * editor too — no extra plumbing.
   */
  const replaceAll = useCallback(
    (snippet, fenceLanguage) => {
      if (!editor) return;

      editor.executeEdits('ai-pair', [
        { range: editor.getModel().getFullModelRange(), text: snippet, forceMoveMarkers: true },
      ]);
      editor.pushUndoStop();

      // If the model answered in Python while you sat in JavaScript, follow it.
      const detected = normalizeLanguage(fenceLanguage);
      if (detected) setLanguage(detected);

      editor.focus();
      flashMessage(room ? 'Applied · shared with the room' : 'Applied · Ctrl/Cmd+Z to undo');
    },
    [editor, room, flashMessage],
  );

  /** Drop the code in at the cursor, replacing the selection if there is one. */
  const insertAtCursor = useCallback(
    (snippet) => {
      if (!editor) return;

      editor.executeEdits('ai-pair', [
        { range: editor.getSelection(), text: snippet, forceMoveMarkers: true },
      ]);
      editor.pushUndoStop();
      editor.focus();

      flashMessage('Inserted at cursor');
    },
    [editor, flashMessage],
  );

  /**
   * Switching language never touches code you've written — except when there's
   * nothing to touch. An empty file gets a small runnable starter, so the Run
   * button has something to do the moment you pick C++.
   */
  const changeLanguage = useCallback(
    (next) => {
      setLanguage(next);

      if (!editor || editor.getValue().trim() || !STARTERS[next]) return;

      editor.executeEdits('starter', [
        {
          range: editor.getModel().getFullModelRange(),
          text: STARTERS[next],
          forceMoveMarkers: true,
        },
      ]);
      editor.pushUndoStop();
    },
    [editor],
  );

  // ------------------------------------------------------- the chat + the run

  // Read at call time rather than passed as a prop, so both the model and the
  // compiler always see the file exactly as it is right now.
  const getEditorState = useCallback(
    () => ({ code: editor?.getValue() ?? '', language }),
    [editor, language],
  );

  const handleReplyComplete = useCallback(
    (reply) => {
      if (!autoApply) return;

      const block = firstCodeBlock(reply);
      if (block) replaceAll(block.content, block.language);
    },
    [autoApply, replaceAll],
  );

  const chat = useChat({ getEditorState, onReplyComplete: handleReplyComplete });
  const runner = useRunner({ getEditorState });

  // ---------------------------------------------------------------- the rooms

  const startRoom = async () => {
    const { room: created } = await createRoom(); // private by default
    writeRoomToUrl(created.roomId);
    setRoom({ id: created.roomId, seed: true }); // our current code becomes its first version
    setDetails(created);
  };

  const openRoom = (roomId) => {
    writeRoomToUrl(roomId);
    setRoom({ id: roomId, seed: false });
  };

  const leaveRoom = () => {
    writeRoomToUrl(null);
    setRoom(null);
    setManaging(false);
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar onOpenRoom={openRoom} onStartRoom={startRoom} />

      {room && !denied && (
        <RoomBar
          room={room}
          details={details}
          status={collab.status}
          peers={collab.peers}
          user={user}
          onManage={() => setManaging(true)}
          onLeave={leaveRoom}
        />
      )}

      {(denied || collab.error) && (
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-danger/40 bg-danger/10 px-4 py-2.5">
          <p className="text-xs text-danger">{denied ?? collab.error}</p>
          <button
            onClick={leaveRoom}
            className="shrink-0 rounded-md border border-danger/40 px-2 py-1 text-[11px] text-danger transition-colors hover:bg-danger/10"
          >
            Work on your own instead
          </button>
        </div>
      )}

      <main className="min-h-0 flex-1">
        <SplitPane
          left={
            <EditorPane
              language={language}
              onLanguageChange={changeLanguage}
              onReady={onEditorReady}
              roomId={denied ? null : room?.id}
              runner={runner}
            />
          }
          right={
            <ChatPanel
              chat={chat}
              autoApply={autoApply}
              onToggleAutoApply={() => setAutoApply((current) => !current)}
              onInsert={insertAtCursor}
              onReplace={replaceAll}
            />
          }
        />
      </main>

      <StatusBar
        editor={editor}
        language={language}
        isStreaming={chat.isStreaming}
        flash={flash}
        peerCount={collab.peers.length}
      />

      {managing && details && (
        <RoomSettings room={details} onChange={setDetails} onClose={() => setManaging(false)} />
      )}
    </div>
  );
}
