/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // toggled by adding/removing `dark` on <html>
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      /**
       * Every colour is a CSS variable defined in index.css, so light and dark
       * mode are the same class names with different values behind them.
       * The `rgb(var(--x) / <alpha-value>)` shape is what lets opacity
       * modifiers like `bg-accent/10` keep working.
       */
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          fg: 'rgb(var(--accent-fg) / <alpha-value>)',   // text sitting ON the accent
          text: 'rgb(var(--accent-text) / <alpha-value>)', // accent used AS text
        },
      },
      // Makes a bare `border` class use our token instead of Tailwind's grey.
      borderColor: {
        DEFAULT: 'rgb(var(--border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
