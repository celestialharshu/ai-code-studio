import { cn } from '../../lib/cn.js';

export default function Toggle({ checked, onChange, label, title }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      title={title}
      className="flex items-center gap-2 rounded text-[11px] text-muted transition-colors hover:text-text"
    >
      <span
        className={cn(
          'relative h-4 w-7 rounded-full transition-colors',
          checked ? 'bg-accent' : 'border border-border bg-elevated',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full transition-all',
            checked ? 'left-3.5 bg-accent-fg' : 'left-0.5 bg-muted',
          )}
        />
      </span>
      {label}
    </button>
  );
}
