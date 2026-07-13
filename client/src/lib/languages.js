export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', extension: 'js', runnable: true },
  { id: 'typescript', label: 'TypeScript', extension: 'ts', runnable: true },
  { id: 'python', label: 'Python', extension: 'py', runnable: true },
  { id: 'cpp', label: 'C++', extension: 'cpp', runnable: true },
  { id: 'java', label: 'Java', extension: 'java', runnable: true },
  { id: 'html', label: 'HTML', extension: 'html', runnable: false },
  { id: 'css', label: 'CSS', extension: 'css', runnable: false },
  { id: 'json', label: 'JSON', extension: 'json', runnable: false },
  { id: 'sql', label: 'SQL', extension: 'sql', runnable: false },
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
 * Used to auto-switch the editor when the model replies in Python while you were
 * sitting in JavaScript.
 */
export function normalizeLanguage(tag) {
  if (!tag) return null;

  const id = ALIASES[tag.toLowerCase()] ?? tag.toLowerCase();
  return LANGUAGES.some((language) => language.id === id) ? id : null;
}

const find = (id) => LANGUAGES.find((language) => language.id === id);

export const extensionFor = (id) => find(id)?.extension ?? 'txt';
export const labelFor = (id) => find(id)?.label ?? id;
export const isRunnable = (id) => find(id)?.runnable ?? false;

/**
 * Dropped in when you switch language with an empty file. Each one reads from
 * stdin, so the Input box below the terminal has something to do from the very
 * first run.
 */
export const STARTERS = {
  javascript: [
    "const name = require('fs').readFileSync(0, 'utf8').trim() || 'world';",
    '',
    'console.log(`Hello, ${name}!`);',
    '',
  ].join('\n'),

  typescript: [
    "const name: string = require('fs').readFileSync(0, 'utf8').trim() || 'world';",
    '',
    'console.log(`Hello, ${name}!`);',
    '',
  ].join('\n'),

  python: [
    'name = input("").strip() or "world"',
    '',
    'print(f"Hello, {name}!")',
    '',
  ].join('\n'),

  cpp: [
    '#include <iostream>',
    '#include <string>',
    '',
    'int main() {',
    '    std::string name;',
    '    std::cin >> name;',
    '',
    '    std::cout << "Hello, " << name << "!" << std::endl;',
    '    return 0;',
    '}',
    '',
  ].join('\n'),

  java: [
    'import java.util.Scanner;',
    '',
    'public class Main {',
    '    public static void main(String[] args) {',
    '        Scanner in = new Scanner(System.in);',
    '        String name = in.hasNext() ? in.next() : "world";',
    '',
    '        System.out.println("Hello, " + name + "!");',
    '    }',
    '}',
    '',
  ].join('\n'),
};

export const STARTER_CODE = STARTERS.javascript;
