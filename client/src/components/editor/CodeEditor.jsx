import { memo, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, Play } from 'lucide-react';

import LanguageSelect from './LanguageSelect.jsx';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import { APP_DARK, APP_LIGHT, defineMonacoThemes } from '../../theme/monacoThemes.js';
import { STARTER_CODE, extensionFor, isRunnable, labelFor } from '../../lib/languages.js';

/**
 * The editor is deliberately *uncontrolled*: React sets the starting text and
 * then never touches the content again.
 *
 * Everything that writes code — you typing, the AI applying a snippet, a
 * collaborator's keystrokes arriving over the network — goes through Monaco's
 * own model. That gives us three things for free:
 *
 *   - no re-render on every keystroke (React never sees the text)
 *   - one undo stack, so Ctrl/Cmd+Z undoes the AI just like it undoes you
 *   - Yjs only has to watch one thing: the model
 *
 * Whoever needs the code (the AI building context, the Run button) reads it on
 * demand with editor.getValue().
 */
function CodeEditor({ language, onLanguageChange, onReady, roomId, onRun, running }) {
  const { theme } = useTheme();

  const runnable = isRunnable(language);

  // Monaco registers a keyboard command once, at mount, and holds whatever
  // function it was given at that moment. A ref keeps the shortcut pointing at
  // the current one instead of a stale closure.
  const runRef = useRef(onRun);
  useEffect(() => {
    runRef.current = onRun;
  }, [onRun]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3">
        <span className="truncate font-mono text-xs text-muted">main.{extensionFor(language)}</span>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelect value={language} onChange={onLanguageChange} />

          <button
            onClick={() => runRef.current?.()}
            disabled={!runnable || running}
            title={runnable ? 'Run (Ctrl/Cmd+Enter)' : `${labelFor(language)} can't be run here`}
            className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            {running ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Play size={11} fill="currentColor" />
            )}
            {running ? 'Running' : 'Run'}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          // Remount on room change. Joining a room means adopting the room's
          // document, so the editor starts fresh and Yjs fills it in.
          key={roomId ?? 'solo'}
          defaultValue={STARTER_CODE}
          language={language}
          theme={theme === 'dark' ? APP_DARK : APP_LIGHT}
          // beforeMount is the only moment Monaco lets you register a theme.
          beforeMount={defineMonacoThemes}
          onMount={(editor, monaco) => {
            onReady(editor);
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
            editor.focus();
          }}
          loading={<p className="p-4 text-sm text-muted">Loading editor…</p>}
          options={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 13,
            lineHeight: 22,
            fontLigatures: true,
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            renderLineHighlight: 'line',
            cursorBlinking: 'phase',
            tabSize: 2,
            automaticLayout: true, // re-measures itself when a pane is dragged
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
        />
      </div>
    </div>
  );
}

// Every prop here is stable, so the editor sits still while the AI streams a
// reply into the panel next to it.
export default memo(CodeEditor);
