import { useEffect, useState } from 'react';
import { getHealth } from '../../lib/api.js';
import { cn } from '../../lib/cn.js';

export default function StatusBar({ editor, language, isStreaming, flash, peerCount }) {
  const [online, setOnline] = useState(null); // null while we're still checking
  const [cursor, setCursor] = useState({ lineNumber: 1, column: 1 });

  // Render's free tier sleeps after 15 minutes idle, so the first request after
  // a break can take ~30s. Knowing the backend is awake before you type saves
  // you wondering whether the app is broken.
  useEffect(() => {
    getHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  // The status bar subscribes to the cursor itself rather than having App pass
  // it down. Cursor position changes on every keypress, and this keeps that
  // churn from re-rendering the entire app.
  useEffect(() => {
    if (!editor) return;

    const subscription = editor.onDidChangeCursorPosition((event) => setCursor(event.position));
    return () => subscription.dispose();
  }, [editor]);

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between gap-4 border-t border-border bg-surface px-4 font-mono text-[11px] text-muted">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              online === null && 'bg-muted',
              online === true && 'bg-accent',
              online === false && 'bg-danger',
            )}
          />
          {online === null ? 'connecting' : online ? 'backend online' : 'backend offline'}
        </span>

        <span className="hidden sm:inline">{language}</span>
        <span className="hidden sm:inline">
          Ln {cursor.lineNumber}, Col {cursor.column}
        </span>

        {peerCount > 0 && (
          <span className="hidden text-accent-text sm:inline">
            {peerCount} {peerCount === 1 ? 'collaborator' : 'collaborators'}
          </span>
        )}
      </div>

      <span className={cn('truncate', flash && 'text-accent-text')}>
        {flash ?? (isStreaming ? 'generating…' : 'ready')}
      </span>
    </footer>
  );
}
