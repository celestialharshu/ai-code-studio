/**
 * Splits an assistant reply into plain-text and code segments.
 *
 * The model is instructed to fence its code, so one regex is enough — no
 * markdown library needed. The same parsed output drives both the rendering of
 * a message and the decision about what gets applied to the editor, so the two
 * can never disagree.
 */
const FENCED_BLOCK = /```(\w+)?\n?([\s\S]*?)```/g;

export function parseMessage(text = '') {
  const segments = [];
  let cursor = 0;

  for (const match of text.matchAll(FENCED_BLOCK)) {
    const [whole, language, code] = match;

    if (match.index > cursor) {
      segments.push({ type: 'text', content: text.slice(cursor, match.index) });
    }

    segments.push({
      type: 'code',
      language: language ?? '',
      content: code.replace(/\n$/, ''), // drop the newline before the closing fence
    });

    cursor = match.index + whole.length;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', content: text.slice(cursor) });
  }

  return segments.filter((segment) => segment.content.trim() !== '');
}

/**
 * Same thing, but for a reply that is still arriving. Halfway through a code
 * block the closing ``` hasn't been sent yet, so we temporarily close it —
 * otherwise the code would render as prose until the model finishes.
 */
export function parseStreamingMessage(text = '') {
  const fences = (text.match(/```/g) ?? []).length;
  return parseMessage(fences % 2 === 0 ? text : `${text}\n\`\`\``);
}

export function firstCodeBlock(text) {
  return parseMessage(text).find((segment) => segment.type === 'code') ?? null;
}
