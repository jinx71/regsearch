import type { BenchmarkData, MetricScores } from "../types";
import { METRIC_LABELS, MODE_META, MODE_ORDER } from "../types";

// Which mode wins each metric (for the highlight). Ties keep the first.
function bestByMetric(data: BenchmarkData) {
  const best: Partial<Record<keyof MetricScores, string>> = {};
  for (const { key } of METRIC_LABELS) {
    let winner = MODE_ORDER[0];
    let top = -Infinity;
    for (const mode of MODE_ORDER) {
      const v = data.modes[mode][key];
      if (v > top) {
        top = v;
        winner = mode;
      }
    }
    best[key] = winner;
  }
  return best;
}

export default function MetricsTable({ data }: { data: BenchmarkData }) {
  const best = bestByMetric(data);

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-paper/60 text-left">
            <th className="px-4 py-2.5 font-medium text-ink-soft">Mode</th>
            {METRIC_LABELS.map((m) => (
              <th
                key={m.key}
                className="px-3 py-2.5 font-medium text-ink-soft text-right whitespace-nowrap"
              >
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODE_ORDER.map((mode) => {
            const meta = MODE_META[mode];
            return (
              <tr key={mode} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="font-medium text-ink">{meta.label}</span>
                  </span>
                </td>
                {METRIC_LABELS.map((m) => {
                  const v = data.modes[mode][m.key];
                  const isBest = best[m.key] === mode;
                  return (
                    <td
                      key={m.key}
                      className="px-3 py-2.5 text-right mono-num"
                      style={
                        isBest
                          ? { color: meta.color, fontWeight: 600 }
                          : { color: "#3B4D5F" }
                      }
                    >
                      {v.toFixed(4)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
