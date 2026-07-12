export default function Field({ label, hint, ...input }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-text">{label}</span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </span>

      <input
        {...input}
        className="rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
      />
    </label>
  );
}
