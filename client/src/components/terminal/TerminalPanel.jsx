import { ChevronDown, ChevronUp, CornerDownLeft, Trash2 } from 'lucide-react';

import { cn } from '../../lib/cn.js';

export default function TerminalPanel({ runner, open, onToggle, height, onDragStart }) {
  const { result, error, running, stdin, setStdin, clear } = runner;

  return (
    <div
      className="flex shrink-0 flex-col border-t border-border bg-surface"
      style={open ? { height } : undefined}
    >
      {/* Drag the top edge to resize. 1px line, 7px grab area. */}
      {open && (
        <div
          onPointerDown={onDragStart}
          role="separator"
          aria-orientation="horizontal"
          className="-mt-[3px] h-[7px] shrink-0 cursor-row-resize"
        />
      )}

      <header className="flex h-9 shrink-0 items-center justify-between px-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 rounded text-xs text-muted transition-colors hover:text-text"
        >
          {open ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          Terminal
        </button>

        <div className="flex items-center gap-3">
          {result && (
            <span className="hidden font-mono text-[11px] text-muted sm:inline">
              {result.provider} · {result.timeMs}ms ·{' '}
              <span className={result.exitCode === 0 ? 'text-accent-text' : 'text-danger'}>
                exit {result.exitCode}
              </span>
            </span>
          )}

          {open && (result || error) && (
            <button
              onClick={clear}
              title="Clear output"
              className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-elevated hover:text-text"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </header>

      {open && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="scrollbar-thin min-h-0 flex-1 overflow-auto bg-bg px-3 py-2 font-mono text-[12.5px] leading-relaxed">
            <Output running={running} error={error} result={result} />
          </div>

          {/* Wandbox and Piston run your code to completion and hand back what it
              printed — there is no live process to type into. So input goes in
              before you press Run, not during. */}
          <div className="shrink-0 border-t border-border px-3 py-2">
            <label className="flex items-center gap-1.5 text-[11px] text-muted">
              <CornerDownLeft size={11} />
              Input (stdin) — sent to your program when you run it
            </label>

            <textarea
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              rows={2}
              spellCheck={false}
              placeholder="One value per line, exactly as you'd type it into a real terminal"
              className="scrollbar-thin mt-1.5 w-full resize-none rounded-lg border border-border bg-bg px-2.5 py-1.5 font-mono text-[12px] text-text transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Output({ running, error, result }) {
  if (running) {
    return (
      <p className="text-muted">
        Running<span className="caret">▍</span>
      </p>
    );
  }

  if (error) return <pre className="whitespace-pre-wrap text-danger">{error}</pre>;

  if (!result) {
    return (
      <p className="text-muted">
        Press <span className="text-accent-text">Run</span> — or Ctrl/Cmd+Enter — to execute what's
        in the editor.
      </p>
    );
  }

  const silent = !result.stdout && !result.stderr && !result.compilerOutput;

  return (
    <div className="flex flex-col gap-2">
      {result.fellBack && (
        <p className="text-[11px] text-muted">
          Wandbox didn't answer, so this ran on Piston instead.
        </p>
      )}

      {/* Compiler noise first — it's what stopped the program existing at all. */}
      {result.compilerOutput && (
        <pre
          className={cn(
            'whitespace-pre-wrap',
            result.exitCode === 0 ? 'text-muted' : 'text-danger',
          )}
        >
          {result.compilerOutput}
        </pre>
      )}

      {result.stdout && <pre className="whitespace-pre-wrap text-text">{result.stdout}</pre>}
      {result.stderr && <pre className="whitespace-pre-wrap text-danger">{result.stderr}</pre>}

      {silent && <p className="text-muted">Ran cleanly, printed nothing.</p>}

      {result.exitCode !== 0 && (
        <p className="text-[11px] text-danger">Process exited with code {result.exitCode}.</p>
      )}
    </div>
  );
}
