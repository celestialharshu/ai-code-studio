import { useCallback, useRef, useState } from 'react';

import { runCode } from '../lib/api.js';
import { isRunnable } from '../lib/languages.js';

/**
 * The Run button.
 *
 * Wandbox and Piston are *batch* executors: they take your code and your input,
 * run it to completion, and hand back what it printed. There's no live process
 * on the other end to type into — which is why stdin is a box you fill in
 * *before* you hit Run, rather than a prompt you answer while it runs.
 *
 * Making it interactive would mean holding a real process open in a container
 * and streaming a PTY over a websocket. That's a Docker host, and it is nowhere
 * near a free tier.
 */
export function useRunner({ getEditorState }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [stdin, setStdinValue] = useState('');

  // Kept in refs so `run` stays referentially stable — otherwise it would change
  // on every keystroke in the stdin box, and the Ctrl+Enter shortcut Monaco
  // registered at mount would be holding a stale copy of it.
  const stdinRef = useRef('');
  const runningRef = useRef(false);

  const setStdin = useCallback((value) => {
    stdinRef.current = value;
    setStdinValue(value);
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current) return;

    const { code, language } = getEditorState();
    if (!isRunnable(language) || !code.trim()) return;

    runningRef.current = true;
    setRunning(true);
    setError(null);

    try {
      setResult(await runCode({ language, code, stdin: stdinRef.current }));
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [getEditorState]);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, error, running, stdin, setStdin, run, clear };
}
