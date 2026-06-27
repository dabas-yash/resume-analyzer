// CandidateCard.tsx — one ranked candidate: score ring + skill breakdown.

import { useState } from "react";
import type { ResumeResult } from "../api";
import ScoreRing from "./ScoreRing";

interface Props {
  result: ResumeResult;
  index: number;
}

function Chip({
  label,
  tone,
  title,
}: {
  label: string;
  tone: "good" | "mid" | "weak";
  title?: string;
}) {
  const styles = {
    good: "bg-good/10 text-good border-good/20",
    mid: "bg-mid/10 text-mid border-mid/25",
    weak: "bg-slatey/8 text-slatey border-line line-through decoration-slatey/40",
  }[tone];
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono ${styles}`}
    >
      {label}
    </span>
  );
}

export default function CandidateCard({ result, index }: Props) {
  const [open, setOpen] = useState(index === 0);
  const isTop = result.rank === 1;

  return (
    <div
      className={`rise rounded-2xl border bg-surface shadow-card overflow-hidden ${
        isTop ? "border-indigo/40 ring-1 ring-indigo/20" : "border-line"
      }`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex flex-col items-center w-7 shrink-0">
            <span className="font-display font-bold text-lg text-ink leading-none">
              {result.rank}
            </span>
            {isTop && (
              <span className="mt-1 text-[8px] uppercase tracking-wider font-semibold text-indigo">
                top
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink truncate">
              {result.name}
            </p>
            <p className="text-xs text-slatey mt-0.5">
              {result.matched.length} matched · {result.partial.length} partial ·{" "}
              {result.missing.length} missing
            </p>
          </div>
        </div>
        <ScoreRing score={result.score} />
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full border-t border-line px-4 py-2 text-xs font-medium text-slatey hover:bg-canvas text-left"
      >
        {open ? "Hide" : "Show"} skill breakdown
      </button>

      {open && (
        <div className="px-4 py-3 border-t border-line space-y-3">
          {result.matched.length > 0 && (
            <Section title="Matched">
              {result.matched.map((t) => (
                <Chip key={t} label={t} tone="good" />
              ))}
            </Section>
          )}
          {result.partial.length > 0 && (
            <Section title="Partial (fuzzy)">
              {result.partial.map((m) => (
                <Chip
                  key={m.term}
                  label={m.term}
                  tone="mid"
                  title={`matched "${m.evidence}" · ${Math.round(
                    m.quality * 100
                  )}% similar`}
                />
              ))}
            </Section>
          )}
          {result.missing.length > 0 && (
            <Section title="Missing">
              {result.missing.map((t) => (
                <Chip key={t} label={t} tone="weak" />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slatey mb-1.5">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
