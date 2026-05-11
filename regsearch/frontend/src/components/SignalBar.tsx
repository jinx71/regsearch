interface SignalBarProps {
  // 0..1 normalized strength within the current result set.
  value: number;
  color: string;
  // Raw score shown as a mono number next to the bar.
  score: number;
}

// The signature element: a horizontal "signal strength" bar whose fill is
// proportional to a result's relevance relative to the top hit. Each search
// mode gets its own channel color so the bars read consistently across pages.
export default function SignalBar({ value, color, score }: SignalBarProps) {
  const pct = Math.max(2, Math.min(100, value * 100));
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative h-1.5 flex-1 rounded-full bg-line overflow-hidden"
        role="meter"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full origin-left animate-bar-grow"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="mono-num text-xs text-ink-soft w-14 text-right">
        {score.toFixed(4)}
      </span>
    </div>
  );
}
