import { useCallback, useEffect, useRef, useState } from 'react';

import CodeEditor from './CodeEditor.jsx';
import TerminalPanel from '../terminal/TerminalPanel.jsx';

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 520;

/**
 * The editor with a terminal underneath it, the way an IDE is laid out.
 *
 * The terminal's header strip is always visible even when it's closed — the one
 * thing worse than no terminal is a terminal you can't find.
 */
export default function EditorPane({ language, onLanguageChange, onReady, roomId, runner }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(260);
  const [dragging, setDragging] = useState(false);
  const paneRef = useRef(null);

  // Open the terminal the first time you run something, so the output isn't
  // sitting in a panel you never noticed.
  useEffect(() => {
    if (runner.running) setOpen(true);
  }, [runner.running]);

  const handleMove = useCallback((event) => {
    const pane = paneRef.current;
    if (!pane) return;

    const { bottom } = pane.getBoundingClientRect();
    setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, bottom - event.clientY)));
  }, []);

  // Listen on the window, not the handle: the pointer moves faster than React
  // re-renders and would otherwise escape the grab area mid-drag.
  useEffect(() => {
    if (!dragging) return;

    const stop = () => setDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
    };
  }, [dragging, handleMove]);

  return (
    <div ref={paneRef} className={`flex h-full flex-col ${dragging ? 'select-none' : ''}`}>
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={language}
          onLanguageChange={onLanguageChange}
          onReady={onReady}
          roomId={roomId}
          onRun={runner.run}
          running={runner.running}
        />
      </div>

      <TerminalPanel
        runner={runner}
        open={open}
        onToggle={() => setOpen((current) => !current)}
        height={height}
        onDragStart={() => setDragging(true)}
      />
    </div>
  );
}
