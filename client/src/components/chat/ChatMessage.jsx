import { motion } from 'framer-motion';

import CodeBlock from './CodeBlock.jsx';
import { parseStreamingMessage } from '../../lib/parseMessage.js';
import { cn } from '../../lib/cn.js';

export default function ChatMessage({ message, isStreaming, onInsert, onReplace }) {
  const isUser = message.role === 'user';

  const segments = isUser
    ? [{ type: 'text', content: message.content }]
    : parseStreamingMessage(message.content);

  const waiting = isStreaming && !isUser && message.content === '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-2"
    >
      <span
        className={cn(
          'font-mono text-[10px] uppercase tracking-widest',
          isUser ? 'text-muted' : 'text-accent-text',
        )}
      >
        {isUser ? 'You' : 'Pair'}
      </span>

      {waiting && (
        <p className="text-sm text-muted">
          Thinking<span className="caret">▍</span>
        </p>
      )}

      {segments.map((segment, index) =>
        segment.type === 'code' ? (
          <CodeBlock
            key={index}
            language={segment.language}
            code={segment.content}
            onInsert={onInsert}
            onReplace={onReplace}
          />
        ) : (
          <p
            key={index}
            className={cn(
              'whitespace-pre-wrap text-sm leading-relaxed',
              isUser && 'rounded-lg bg-elevated px-3 py-2',
            )}
          >
            {renderInline(segment.content.trim())}
            {isStreaming && !isUser && index === segments.length - 1 && (
              <span className="caret">▍</span>
            )}
          </p>
        ),
      )}
    </motion.div>
  );
}

/**
 * Handles `inline code` and **bold** without pulling in a markdown library.
 * The model is told to keep its prose plain, so this covers what actually shows
 * up. Split on the delimiters, then decide what each piece is.
 */
function renderInline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="rounded bg-elevated px-1 py-0.5 font-mono text-[12px] text-accent-text"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}
