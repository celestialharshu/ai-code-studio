import { memo } from 'react';
import Editor from '@monaco-editor/react';

import LanguageSelect from './LanguageSelect.jsx';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import { APP_DARK, APP_LIGHT, defineMonacoThemes } from '../../theme/monacoThemes.js';
import { STARTER_CODE, extensionFor } from '../../lib/languages.js';

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
 * Whoever needs the code (the AI, when building context) reads it on demand
 * with editor.getValue().
 */
function CodeEditor({ language, onLanguageChange, onReady, roomId }) {
  const { theme } = useTheme();

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface px-3">
        <span className="font-mono text-xs text-muted">main.{extensionFor(language)}</span>
        <LanguageSelect value={language} onChange={onLanguageChange} />
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
          onMount={(editor) => {
            onReady(editor);
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
            automaticLayout: true, // re-measures itself when the split pane is dragged
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
