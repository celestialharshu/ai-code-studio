// The slim entry point — the editor core, with no languages attached.
// This is the exact module y-monaco imports, which is what lets the React
// wrapper and the collaboration binding share a single Monaco instance.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { loader } from '@monaco-editor/react';

// Syntax highlighting, one import per language we actually offer. The default
// `monaco-editor` bundle ships ~80 of these; we offer nine, so we pay for nine.
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';

// The language *services* — completion, hover, error squiggles. These are the
// ones that need a web worker. JSON has no tokenizer above because its service
// provides one.
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/language/css/monaco.contribution';
import 'monaco-editor/esm/vs/language/html/monaco.contribution';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

/**
 * Bundle Monaco ourselves instead of letting @monaco-editor/react fetch it from
 * a CDN at runtime.
 *
 * This is not optional. y-monaco imports Monaco from npm; if the React wrapper
 * loads a *second* copy from a CDN, the two don't share classes and
 * collaboration breaks in ways that are miserable to debug. One instance,
 * handed to both. It also means the editor still works with no internet, which
 * is worth a lot on demo day.
 *
 * Monaco runs its language intelligence in web workers. Vite's `?worker` import
 * bundles each one; this tells Monaco which to spin up for a given language.
 */
self.MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });
