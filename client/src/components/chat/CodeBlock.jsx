import { useState } from 'react';
import { ArrowLeftRight, Check, Copy, CornerDownLeft } from 'lucide-react';

/**
 * A code block in the chat, with the three things you actually want to do with
 * one: copy it, drop it in at the cursor, or swap the whole file for it.
 *
 * Both editor actions go through Monaco's edit stack, so Ctrl/Cmd+Z undoes them
 * like any other edit you made by hand.
 */
export default function CodeBlock({ language, code, onInsert, onReplace }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg">
      <div className="flex items-center justify-between border-b border-border bg-elevated px-2.5 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {language || 'code'}
        </span>

        <div className="flex items-center gap-0.5">
          <Action icon={copied ? Check : Copy} label={copied ? 'Copied' : 'Copy'} onClick={copy} />
          <Action icon={CornerDownLeft} label="Insert" onClick={() => onInsert(code)} />
          <Action icon={ArrowLeftRight} label="Replace" onClick={() => onReplace(code, language)} />
        </div>
      </div>

      <pre className="scrollbar-thin overflow-x-auto p-3">
        <code className="font-mono text-[12.5px] leading-relaxed">{code}</code>
      </pre>
    </div>
  );
}

function Action({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted transition-colors hover:bg-surface hover:text-text"
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
