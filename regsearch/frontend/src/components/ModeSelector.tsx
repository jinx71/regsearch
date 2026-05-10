import type { SearchMode } from "../types";
import { MODE_META, MODE_ORDER } from "../types";

interface ModeSelectorProps {
  value: SearchMode;
  onChange: (m: SearchMode) => void;
}

// Segmented selector. The active segment is filled with that mode's channel
// color so the choice ties visually to the result bars below.
export default function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const active = MODE_META[value];
  return (
    <div className="space-y-2">
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-panel p-1">
        {MODE_ORDER.map((m) => {
          const meta = MODE_META[m];
          const isActive = m === value;
          return (
            <button
              key={m}
              onClick={() => onChange(m)}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              style={
                isActive
                  ? { backgroundColor: meta.color, color: "#fff" }
                  : { color: "#3B4D5F" }
              }
              aria-pressed={isActive}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-faint">
        <span className="font-medium" style={{ color: active.color }}>
          {active.short}
        </span>{" "}
        — {active.blurb}
      </p>
    </div>
  );
}
