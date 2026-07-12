/**
 * Every instruction the model sees before the user's message lives here.
 * Keeping prompts in one file (instead of inline strings buried in a
 * controller) makes them easy to tweak, diff, and reason about.
 */

const FENCE = '```';

const MAX_CODE_CHARS = 6000; // roughly 1.5k tokens — protects the free-tier quota
const MAX_HISTORY = 10;      // how many past turns to replay as context

export const SYSTEM_PROMPT = `You are Pair, an AI pair programmer built into a code editor.

How you work:
- Be concise. A short explanation, then the code. No filler, no restating the question.
- When you write or change code, put it in ONE fenced code block with a language tag
  (for example ${FENCE}javascript). That block is applied directly to the user's editor,
  so it must be complete and runnable on its own. Never abbreviate with placeholders
  like "// ...rest of the code".
- If you are only answering a question and do not want to touch the editor, do not use
  a fenced code block at all.
- If a request is ambiguous, make a sensible assumption, state it in one line, and write
  the code anyway.
- Prefer plain, readable code over clever code. The person reading it is learning from it.`;

/**
 * The model can't see the editor, so we describe it. This is the whole reason
 * the assistant feels "aware" of the file you're working in.
 */
export function buildEditorContext({ code, language }) {
  if (!code.trim()) {
    return `The editor is currently empty. The selected language is ${language}.`;
  }

  const body = code.length > MAX_CODE_CHARS
    ? `${code.slice(0, MAX_CODE_CHARS)}\n... (truncated)`
    : code;

  return [
    `Current contents of the user's editor (language: ${language}):`,
    `${FENCE}${language}`,
    body,
    FENCE,
  ].join('\n');
}

export function buildMessages({ history, code, language }) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: buildEditorContext({ code, language }) },
    ...history
      .slice(-MAX_HISTORY)
      .map(({ role, content }) => ({ role, content })),
  ];
}
