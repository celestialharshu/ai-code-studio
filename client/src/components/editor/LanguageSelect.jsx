import { ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../../lib/languages.js';

export default function LanguageSelect({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Editor language"
        className="appearance-none rounded-md border border-border bg-surface py-1 pl-2.5 pr-7 text-xs text-text transition-colors hover:bg-elevated focus:border-accent focus:outline-none"
      >
        {LANGUAGES.map((language) => (
          <option key={language.id} value={language.id}>
            {language.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
