// JobDescriptionInput.tsx — the JD textarea panel.

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function JobDescriptionInput({ value, onChange }: Props) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-display font-semibold text-sm text-ink">
          Job description
        </label>
        <span className="text-xs text-slatey">{value.length} chars</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here — the more detail, the sharper the ranking."
        rows={9}
        className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-slatey/60 focus:border-indigo focus:ring-4 focus:ring-indigo/10"
      />
    </div>
  );
}
