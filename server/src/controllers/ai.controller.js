import { streamGroqCompletion } from '../services/groq.service.js';
import { buildMessages } from '../prompts/pairProgrammer.js';

/**
 * POST /api/ai/chat
 *
 * Streams the model's reply back as Server-Sent Events so the UI can render
 * tokens as they arrive instead of waiting for the whole answer.
 *
 * Each event is one JSON object:
 *   data: {"type":"token","value":"const"}
 *   data: {"type":"done"}
 *   data: {"type":"error","message":"..."}
 */
export async function chat(req, res) {
  const { messages = [], code = '', language = 'javascript' } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'bad_request',
      message: 'messages[] is required.',
    });
  }

  /**
   * If the user hits Stop or closes the tab, cancel the Groq request too —
   * otherwise we keep spending quota on tokens nobody will read.
   *
   * This has to listen on `res`, not `req`. Since Node 16, req's 'close' event
   * fires as soon as the request *body* has been read — which express.json()
   * does immediately — so `req.on('close')` would abort every call before it
   * even started. res 'close' fires when the response ends, and
   * `writableFinished` tells us whether that was because we finished (fine) or
   * because the client walked away (abort).
   */
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) abort.abort();
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // stops proxies (Render, nginx) from buffering the stream
  });

  const send = (payload) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const tokens = streamGroqCompletion({
      messages: buildMessages({ history: messages, code, language }),
      signal: abort.signal,
    });

    for await (const token of tokens) {
      send({ type: 'token', value: token });
    }

    send({ type: 'done' });
  } catch (err) {
    if (abort.signal.aborted) return; // client walked away, nobody to tell

    console.error('[ai.controller]', err);
    // Headers went out with the 200 above, so the error has to travel inside
    // the stream rather than as an HTTP status code.
    send({ type: 'error', message: err.userMessage ?? 'The model call failed.' });
  } finally {
    res.end();
  }
}
