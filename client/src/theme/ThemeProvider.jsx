import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

/**
 * Dark / light mode.
 *
 * The only thing that actually changes is a single `dark` class on <html>.
 * Tailwind's `darkMode: 'class'` and the CSS variables in index.css do the
 * rest — no component ever needs to know which theme is active, except the
 * editor (Monaco has its own theme system) and the toggle button itself.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('theme') ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
