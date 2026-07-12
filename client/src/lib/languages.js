export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', extension: 'js' },
  { id: 'typescript', label: 'TypeScript', extension: 'ts' },
  { id: 'python', label: 'Python', extension: 'py' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
  { id: 'java', label: 'Java', extension: 'java' },
  { id: 'html', label: 'HTML', extension: 'html' },
  { id: 'css', label: 'CSS', extension: 'css' },
  { id: 'json', label: 'JSON', extension: 'json' },
  { id: 'sql', label: 'SQL', extension: 'sql' },
];

/** Tags people (and models) actually write on a code fence: ```py, ```jsx ... */
const ALIASES = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  'c++': 'cpp',
  cc: 'cpp',
};

/**
 * Turns a fence tag into a Monaco language id, or null if we don't support it.
 * Used to auto-switch the editor's language when the model replies in Python
 * while you were sitting in JavaScript.
 */
export function normalizeLanguage(tag) {
  if (!tag) return null;
  const id = ALIASES[tag.toLowerCase()] ?? tag.toLowerCase();
  return LANGUAGES.some((language) => language.id === id) ? id : null;
}

export function extensionFor(id) {
  return LANGUAGES.find((language) => language.id === id)?.extension ?? 'txt';
}

export const STARTER_CODE = [
  '// Ask the assistant on the right to build something.',
  '// It can read this file, and its answers land straight back in here.',
  '',
  'function greet(name) {',
  "  return 'Hello, ' + name + '!';",
  '}',
  '',
  "console.log(greet('world'));",
  '',
].join('\n');
