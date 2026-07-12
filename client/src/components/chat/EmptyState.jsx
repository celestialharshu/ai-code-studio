import { Sparkles } from 'lucide-react';

const EXAMPLES = [
  'Create a React navbar with a mobile menu',
  'Write a debounce function with a cancel method',
  'Rewrite the code in my editor as a class',
  'Add JSDoc comments to what I have open',
];

export default function EmptyState({ onPick }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border">
        <Sparkles size={18} className="text-accent-text" />
      </div>

      <div>
        <p className="text-sm font-medium">Ask your pair anything</p>
        <p className="mx-auto mt-1 max-w-[15rem] text-xs leading-relaxed text-muted">
          It reads whatever is in your editor, and its code lands straight back in there.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => onPick(example)}
            className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted transition-colors hover:border-accent hover:text-text"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
