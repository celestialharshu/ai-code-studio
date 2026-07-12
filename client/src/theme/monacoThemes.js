/**
 * Monaco ships with `vs` and `vs-dark`, neither of which match this app.
 * These two themes reuse the exact hex values from index.css, so the editor
 * reads as part of the page instead of a widget someone dropped in.
 *
 * Monaco wants colours as hex strings — with `#` in `colors`, without it in
 * `rules`. That inconsistency is Monaco's, not a typo.
 */
export const APP_DARK = 'app-dark';
export const APP_LIGHT = 'app-light';

export function defineMonacoThemes(monaco) {
  monaco.editor.defineTheme(APP_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '78716c', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f59e0b' },
      { token: 'string', foreground: 'a3e635' },
      { token: 'number', foreground: '38bdf8' },
      { token: 'type', foreground: '5eead4' },
      { token: 'delimiter', foreground: 'a8a29e' },
    ],
    colors: {
      'editor.background': '#0C0A09',
      'editor.foreground': '#E7E5E4',
      'editor.lineHighlightBackground': '#1C1917',
      'editor.selectionBackground': '#44403C',
      'editorCursor.foreground': '#F59E0B',
      'editorLineNumber.foreground': '#44403C',
      'editorLineNumber.activeForeground': '#A8A29E',
      'editorIndentGuide.background1': '#292524',
      'editorIndentGuide.activeBackground1': '#57534E',
      'editorWidget.background': '#1C1917',
      'editorWidget.border': '#292524',
      'editorSuggestWidget.background': '#1C1917',
      'editorSuggestWidget.border': '#292524',
      'editorSuggestWidget.selectedBackground': '#292524',
      'scrollbarSlider.background': '#29252480',
      'scrollbarSlider.hoverBackground': '#44403C80',
      'scrollbarSlider.activeBackground': '#57534E80',
    },
  });

  monaco.editor.defineTheme(APP_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'a8a29e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'b45309' },
      { token: 'string', foreground: '4d7c0f' },
      { token: 'number', foreground: '0369a1' },
      { token: 'type', foreground: '0f766e' },
      { token: 'delimiter', foreground: '78716c' },
    ],
    colors: {
      'editor.background': '#FAFAF9',
      'editor.foreground': '#1C1917',
      'editor.lineHighlightBackground': '#F5F5F4',
      'editor.selectionBackground': '#E7E5E4',
      'editorCursor.foreground': '#B45309',
      'editorLineNumber.foreground': '#D6D3D1',
      'editorLineNumber.activeForeground': '#78716C',
      'editorIndentGuide.background1': '#E7E5E4',
      'editorIndentGuide.activeBackground1': '#D6D3D1',
      'editorWidget.background': '#FFFFFF',
      'editorWidget.border': '#E7E5E4',
      'editorSuggestWidget.background': '#FFFFFF',
      'editorSuggestWidget.border': '#E7E5E4',
      'editorSuggestWidget.selectedBackground': '#F5F5F4',
      'scrollbarSlider.background': '#E7E5E480',
      'scrollbarSlider.hoverBackground': '#D6D3D180',
      'scrollbarSlider.activeBackground': '#A8A29E80',
    },
  });
}
