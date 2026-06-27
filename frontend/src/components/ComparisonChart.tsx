// ComparisonChart.tsx — visual comparison across candidates.
// Two views: match score (bars colored by tier) and skill coverage (stacked).

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  Legend,
  LabelList,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { ResumeResult } from "../api";

interface Props {
  results: ResumeResult[];
}

const GOOD = "#15A34A";
const MID = "#E8930C";
const WEAK = "#E11D48";
const MISSING = "#D3D1C7";

function tierColor(score: number) {
  if (score >= 75) return GOOD;
  if (score >= 50) return MID;
  return WEAK;
}

function shortName(name: string) {
  const base = name.replace(/\.[^.]+$/, ""); // drop extension
  return base.length > 16 ? base.slice(0, 15) + "…" : base;
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E6E8EE",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(21,23,31,0.08)",
};

const TOP_N = 8;

export default function ComparisonChart({ results }: Props) {
  const [view, setView] = useState<"score" | "coverage">("score");
  const [showAll, setShowAll] = useState(false);

  // Results arrive already sorted by rank (best first).
  const visible = showAll ? results : results.slice(0, TOP_N);
  const hasMore = results.length > TOP_N;

  const data = visible.map((r) => ({
    name: shortName(r.name),
    score: r.score,
    matched: r.matched.length,
    partial: r.partial.length,
    missing: r.missing.length,
  }));

  // Height grows with the number of candidates.
  const height = Math.max(160, data.length * 52 + 48);

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card p-4 mb-5">
      <div className="flex items-center justify-between mb-1">
        <p className="font-display font-semibold text-sm text-ink">
          Compare candidates
        </p>
        <div className="inline-flex rounded-lg border border-line p-0.5 bg-canvas">
          {(["score", "coverage"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                view === v
                  ? "bg-surface text-ink shadow-sm"
                  : "text-slatey hover:text-ink"
              }`}
            >
              {v === "score" ? "Match score" : "Skill coverage"}
            </button>
          ))}
        </div>
      </div>

      {hasMore && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slatey">
            Showing {showAll ? "all" : `top ${TOP_N}`} of {results.length}
          </span>
          <button
            onClick={() => setShowAll((s) => !s)}
            className="text-xs font-medium text-indigo hover:underline"
          >
            {showAll ? `Show top ${TOP_N}` : `Show all ${results.length}`}
          </button>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {view === "score" ? (
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="#EDEFF3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              fontSize={11}
              stroke="#9aa0ad"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              fontSize={11}
              stroke="#9aa0ad"
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(79,70,229,0.06)" }}
              contentStyle={tooltipStyle}
              formatter={(v) => [`${v}%`, "Match"]}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={22}>
              {data.map((d, i) => (
                <Cell key={i} fill={tierColor(d.score)} />
              ))}
              <LabelList
                dataKey="score"
                position="right"
                formatter={(v) => `${v}%`}
                fontSize={11}
                fill="#5B6173"
              />
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="#EDEFF3" />
            <XAxis type="number" allowDecimals={false} fontSize={11} stroke="#9aa0ad" />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              fontSize={11}
              stroke="#9aa0ad"
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "rgba(79,70,229,0.06)" }} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="matched" stackId="a" fill={GOOD} barSize={22} />
            <Bar dataKey="partial" stackId="a" fill={MID} barSize={22} />
            <Bar dataKey="missing" stackId="a" fill={MISSING} radius={[0, 4, 4, 0]} barSize={22} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}