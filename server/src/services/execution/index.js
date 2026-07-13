import { runOnWandbox } from './wandbox.js';
import { runOnPiston } from './piston.js';

export const RUNNABLE = ['javascript', 'typescript', 'python', 'cpp', 'java'];

const TIMEOUT_MS = 15_000;

// Tried in order. The first one that answers wins.
const PROVIDERS = [
  ['wandbox', runOnWandbox],
  ['piston', runOnPiston],
];

/**
 * Run some code and hand back one normalised result, whichever service did the
 * work.
 *
 * Both of these have to be called from the server, not the browser: Wandbox
 * sends no CORS headers at all, so a fetch from the page is dead on arrival.
 *
 * Neither publishes an SLA, so we don't bet the demo on either. Wandbox goes
 * first; if it errors or takes longer than 15 seconds, Piston gets a turn. Only
 * if both fail does the user hear about it — and then they hear *why*, from both.
 */
export async function runCode({ language, code, stdin }) {
  if (!RUNNABLE.includes(language)) {
    throw Object.assign(new Error(`${language} can't be run here.`), { status: 400 });
  }

  const started = Date.now();
  const failures = [];

  for (const [name, provider] of PROVIDERS) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

    try {
      const result = await provider({ language, code, stdin, signal: abort.signal });

      return {
        ...result,
        timeMs: Date.now() - started,
        fellBack: failures.length > 0, // the UI mentions it, so the user isn't confused
      };
    } catch (err) {
      failures.push(
        `${name}: ${abort.signal.aborted ? `no answer after ${TIMEOUT_MS / 1000}s` : err.message}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw Object.assign(new Error(`Could not run your code.\n${failures.join('\n')}`), {
    status: 502,
  });
}
