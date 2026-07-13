const EXECUTE_URL = 'https://emkc.org/api/v2/piston/execute';
const RUNTIMES_URL = 'https://emkc.org/api/v2/piston/runtimes';

const PISTON_LANGUAGE = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  cpp: 'c++',
  java: 'java',
};

// Piston writes the code to a real file, so the name matters — Java in
// particular insists the public class match the filename.
const FILENAME = {
  javascript: 'main.js',
  typescript: 'main.ts',
  python: 'main.py',
  cpp: 'main.cpp',
  java: 'Main.java',
};

const CACHE_MS = 60 * 60 * 1000;
let cache = null;

async function versionFor(language, signal) {
  if (!cache || Date.now() - cache.fetchedAt > CACHE_MS) {
    const response = await fetch(RUNTIMES_URL, { signal });
    if (!response.ok) throw new Error(`Piston runtimes returned ${response.status}`);

    cache = { runtimes: await response.json(), fetchedAt: Date.now() };
  }

  const wanted = PISTON_LANGUAGE[language];
  const runtime = cache.runtimes.find(
    (entry) => entry.language === wanted || entry.aliases?.includes(wanted),
  );

  return runtime?.version ?? null;
}

/**
 * The fallback.
 *
 * Piston is a completely separate free execution service with its own machines
 * and its own bad days — which is exactly the point. Two independent services
 * fail on the same afternoon far less often than one does, and "the Run button
 * broke during my demo" is not a story you want to tell.
 */
export async function runOnPiston({ language, code, stdin, signal }) {
  const version = await versionFor(language, signal);
  if (!version) throw new Error(`Piston has no runtime for ${language}.`);

  const response = await fetch(EXECUTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      language: PISTON_LANGUAGE[language],
      version,
      files: [{ name: FILENAME[language], content: code }],
      stdin,
    }),
  });

  if (!response.ok) throw new Error(`Piston returned ${response.status}`);

  const result = await response.json();

  return {
    provider: `piston · ${PISTON_LANGUAGE[language]} ${version}`,
    stdout: result.run?.stdout ?? '',
    stderr: result.run?.stderr ?? '',
    compilerOutput: [result.compile?.stdout, result.compile?.stderr].filter(Boolean).join('\n').trim(),
    exitCode: result.run?.code ?? 0,
  };
}
