// ResultsPanel.tsx — JD keyword summary + the ranked list of candidates.

import { lazy, Suspense } from "react";
import type { AnalyzeResponse } from "../api";
import CandidateCard from "./CandidateCard";

// Code-split: the charting library only loads once results exist.
const ComparisonChart = lazy(() => import("./ComparisonChart"));

interface Props {
  data: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;
}

export default function ResultsPanel({ data, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="h-9 w-9 rounded-full border-2 border-line border-t-indigo animate-spin" />
        <p className="text-sm text-slatey mt-4">Scoring candidates…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-weak/30 bg-weak/5 p-5">
        <p className="font-display font-semibold text-ink">Couldn't run the analysis</p>
        <p className="text-sm text-slatey mt-1">{error}</p>
        <p className="text-xs text-slatey mt-3">
          Make sure the backend is running at the configured API URL, then try again.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6">
        <div className="h-12 w-12 rounded-xl bg-indigo-soft flex items-center justify-center">
          <span className="font-display font-bold text-indigo text-xl">↑</span>
        </div>
        <p className="font-display font-semibold text-ink mt-4">
          Your ranked shortlist appears here
        </p>
        <p className="text-sm text-slatey mt-1 max-w-xs">
          Add a job description and a few resumes, then run the analysis to see
          who fits best.
        </p>
      </div>
    );
  }

  const topKeywords = [...data.keywords]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 12);

  return (
    <div>
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-wide text-slatey mb-2">
          What this job weighs most
        </p>
        <div className="flex flex-wrap gap-1.5">
          {topKeywords.map((k) => (
            <span
              key={k.term}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-0.5 text-xs font-mono text-ink"
            >
              {k.term}
              <span className="text-slatey">×{k.weight}</span>
            </span>
          ))}
        </div>
      </div>

      {data.results.length >= 2 && (
        <Suspense
          fallback={
            <div className="h-40 rounded-2xl border border-line bg-surface mb-5 animate-pulse" />
          }
        >
          <ComparisonChart results={data.results} />
        </Suspense>
      )}

      <div className="space-y-3">
        {data.results.map((r, i) => (
          <CandidateCard key={r.name + i} result={r} index={i} />
        ))}
      </div>
    </div>
  );
}