import { Clock } from "lucide-react";
import type { CompareData } from "../types";
import { MODE_META, MODE_ORDER } from "../types";
import ResultCard from "./ResultCard";
import { normalizeScores } from "../lib/scores";

export default function CompareColumns({ data }: { data: CompareData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {MODE_ORDER.map((mode) => {
        const meta = MODE_META[mode];
        const result = data.modes[mode];
        const hits = result?.results ?? [];
        const norms = normalizeScores(hits);

        return (
          <div key={mode} className="flex flex-col">
            {/* Channel header with a colored top rule. */}
            <div
              className="rounded-t-lg border border-line border-b-0 px-3 py-2.5"
              style={{ borderTop: `3px solid ${meta.color}` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-display font-semibold text-sm"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                  <Clock size={11} />
                  <span className="mono-num">
                    {result ? `${result.took_ms.toFixed(0)}ms` : "—"}
                  </span>
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-faint">
                {meta.blurb}
              </p>
            </div>

            <div className="flex-1 rounded-b-lg border border-line bg-paper/40 p-2 space-y-2">
              {hits.length === 0 ? (
                <p className="text-xs text-ink-faint px-2 py-4 text-center">
                  No results
                </p>
              ) : (
                hits.map((hit, i) => (
                  <ResultCard
                    key={`${mode}-${hit.id}-${i}`}
                    hit={hit}
                    color={meta.color}
                    normalized={norms[i]}
                    index={i}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
