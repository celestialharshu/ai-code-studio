import { config } from '../config/env.js';

/**
 * Wraps a failed Groq call with a message that's actually useful to read.
 */
export class GroqError extends Error {
  constructor(status, body) {
    super(`Groq API error ${status}: ${body}`);
    this.name = 'GroqError';
    this.status = status;
    this.userMessage = explain(status, body);
  }
}

function explain(status, body) {
  if (status === 401) {
    return 'Groq rejected the API key. Check GROQ_API_KEY in server/.env.';
  }
  if (status === 429) {
    return 'Groq rate limit reached. Wait a few seconds and try again.';
  }
  if (status === 404 || (status === 400 && /model/i.test(body))) {
    return `The model "${config.groqModel}" is unavailable — Groq may have retired it. Pick a current one from console.groq.com/docs/models and set GROQ_MODEL in server/.env.`;
  }
  return 'The model call failed. Check the server logs for details.';
}

/**
 * Calls Groq and yields the reply one token at a time.
 *
 * Groq speaks the OpenAI chat-completions protocol, so with `stream: true` the
 * response body is a series of Server-Sent Events:
 *
 *     data: {"choices":[{"delta":{"content":"const"}}]}
 *     data: {"choices":[{"delta":{"content":" x"}}]}
 *     data: [DONE]
 *
 * An async generator is a natural fit: the controller can just `for await` over
 * it and forward each token to the browser.
 */
export async function* streamGroqCompletion({ messages, signal }) {
  const response = await fetch(`${config.groqBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages,
      temperature: 0.3, // low: we want correct code, not creative code
      max_tokens: 2048,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new GroqError(response.status, await response.text());
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    // A network chunk can end mid-event, so keep a buffer and only process
    // whole events (they're separated by a blank line).
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const dataLine = event.split('\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      const data = dataLine.slice(5).trim();
      if (data === '[DONE]') return;

      const token = JSON.parse(data).choices?.[0]?.delta?.content;
      if (token) yield token;
    }
  }
}
