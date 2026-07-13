const LIST_URL = 'https://wandbox.org/api/list.json';
const COMPILE_URL = 'https://wandbox.org/api/compile.json';

// Wandbox's own name for each language, exactly as it appears in list.json.
const WANDBOX_LANGUAGE = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
};

// Which toolchain to prefer when Wandbox offers several for one language.
const PREFERRED = {
  javascript: 'nodejs',
  typescript: 'typescript',
  python: 'cpython',
  cpp: 'gcc',
  java: 'openjdk',
};

const RAW_OPTIONS = {
  cpp: '-std=c++17',
};

const CACHE_MS = 60 * 60 * 1000;
let cache = null; // { compilers, fetchedAt }

/**
 * Wandbox renames a compiler every time it upgrades one — gcc-13.2.0 becomes
 * gcc-14.1.0, and the old id simply stops working. Hardcoding an id means the
 * Run button dies silently one Tuesday for no visible reason.
 *
 * So we ask Wandbox what it actually has today, and cache the answer for an hour.
 */
async function loadCompilers(signal) {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.compilers;

  const response = await fetch(LIST_URL, { signal });
  if (!response.ok) throw new Error(`Wandbox compiler list returned ${response.status}`);

  cache = { compilers: await response.json(), fetchedAt: Date.now() };
  return cache.compilers;
}

async function pickCompiler(language, signal) {
  const compilers = await loadCompilers(signal);
  const candidates = compilers.filter((entry) => entry.language === WANDBOX_LANGUAGE[language]);

  // Prefer a stable release of the toolchain we want. "head" builds are nightly
  // and occasionally broken.
  const stable = candidates.filter(
    (entry) => entry.name.startsWith(PREFERRED[language]) && !entry.name.includes('head'),
  );

  return (stable[0] ?? candidates[0])?.name ?? null;
}

export async function runOnWandbox({ language, code, stdin, signal }) {
  const compiler = await pickCompiler(language, signal);
  if (!compiler) throw new Error(`Wandbox has no compiler for ${language}.`);

  const response = await fetch(COMPILE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      compiler,
      code,
      stdin,
      'compiler-option-raw': RAW_OPTIONS[language] ?? '',
      save: false, // don't create a public permlink for someone's code
    }),
  });

  if (!response.ok) throw new Error(`Wandbox returned ${response.status}`);

  const result = await response.json();

  return {
    provider: `wandbox · ${compiler}`,
    stdout: result.program_output ?? '',
    stderr: result.program_error ?? '',
    compilerOutput: [result.compiler_output, result.compiler_error].filter(Boolean).join('\n').trim(),
    exitCode: Number(result.status ?? 0),
  };
}
