import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import { cn } from '../../lib/cn.js';

export default function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-elevated hover:text-text',
        className,
      )}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
