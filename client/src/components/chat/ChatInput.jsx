import { useRef, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';

export default function ChatInput({ onSend, onStop, isStreaming }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const submit = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value);
    setValue('');
    resetHeight(textareaRef.current);
  };

  const handleKeyDown = (event) => {
    // Enter sends. Shift+Enter is a newline — same as every other chat app.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 border-t border-border p-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-bg p-2 transition-colors focus-within:border-accent">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder="Ask for code, or describe what to build…"
          onChange={(event) => {
            setValue(event.target.value);
            growToFit(event.target);
          }}
          onKeyDown={handleKeyDown}
          className="scrollbar-thin max-h-40 flex-1 resize-none bg-transparent px-1 py-1 text-sm text-text outline-none placeholder:text-muted"
        />

        {isStreaming ? (
          <button
            onClick={onStop}
            title="Stop generating"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-elevated hover:text-text"
          >
            <Square size={12} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim()}
            title="Send (Enter)"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <p className="mt-2 px-1 font-mono text-[10px] text-muted">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  );
}

/** Lets the textarea grow with its content, up to the max-height set in CSS. */
function growToFit(element) {
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

function resetHeight(element) {
  if (element) element.style.height = '';
}
