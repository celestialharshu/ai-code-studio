import { useEffect, useRef } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';

import ChatMessage from './ChatMessage.jsx';
import ChatInput from './ChatInput.jsx';
import EmptyState from './EmptyState.jsx';
import Toggle from '../ui/Toggle.jsx';

export default function ChatPanel({ chat, autoApply, onToggleAutoApply, onInsert, onReplace }) {
  const { messages, isStreaming, error, send, stop, clear } = chat;
  const bottomRef = useRef(null);

  // Follow the reply as it streams in.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-surface">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent-text" />
          <span className="text-xs font-medium">Assistant</span>
        </div>

        <div className="flex items-center gap-3">
          <Toggle
            checked={autoApply}
            onChange={onToggleAutoApply}
            label="Auto-apply"
            title="When on, the first code block of each reply replaces your editor contents. Ctrl/Cmd+Z undoes it."
          />

          <button
            onClick={clear}
            disabled={messages.length === 0}
            title="Clear conversation"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-text disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <div className="flex flex-col gap-5 p-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={isStreaming && index === messages.length - 1}
                onInsert={onInsert}
                onReplace={onReplace}
              />
            ))}

            {error && (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}
