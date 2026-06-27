// ScoreRing.tsx — circular progress whose color encodes match quality.
// The color is meaning, not decoration: strong / partial / weak fit.

interface Props {
  score: number; // 0–100
  size?: number;
}

function colorFor(score: number): string {
  if (score >= 75) return "#15A34A"; // good
  if (score >= 50) return "#E8930C"; // mid
  return "#E11D48"; // weak
}

export default function ScoreRing({ score, size = 72 }: Props) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(score, 100) / 100);
  const color = colorFor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#EDEFF3"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-anim"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-semibold leading-none"
          style={{ color, fontSize: size * 0.26 }}
        >
          {Math.round(score)}
        </span>
        <span className="text-[9px] uppercase tracking-wide text-slatey mt-0.5">
          match
        </span>
      </div>
    </div>
  );
}
