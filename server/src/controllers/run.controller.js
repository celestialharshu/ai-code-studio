import { runCode } from '../services/execution/index.js';

const MAX_CODE_CHARS = 50_000;
const MAX_STDIN_CHARS = 10_000;

/** POST /api/run */
export async function run(req, res) {
  const language = String(req.body?.language ?? '');
  const code = String(req.body?.code ?? '');
  const stdin = String(req.body?.stdin ?? '');

  if (!code.trim()) {
    return res.status(400).json({ error: 'bad_request', message: 'There is no code to run.' });
  }
  if (code.length > MAX_CODE_CHARS) {
    return res.status(413).json({ error: 'too_large', message: 'That file is too big to run.' });
  }
  if (stdin.length > MAX_STDIN_CHARS) {
    return res.status(413).json({ error: 'too_large', message: 'That input is too long.' });
  }

  res.json(await runCode({ language, code, stdin }));
}
