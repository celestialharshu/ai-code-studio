import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  // Escape closes it. Cheap to add, and its absence is the kind of thing people
  // notice without being able to say why the app feels unfinished.
  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()} // clicks inside shouldn't close it
        className="w-full max-w-md rounded-xl border border-border bg-surface"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-text"
          >
            <X size={15} />
          </button>
        </header>

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
