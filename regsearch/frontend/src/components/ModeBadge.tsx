import type { SearchMode } from "../types";
import { MODE_META } from "../types";

export default function ModeBadge({
  mode,
  size = "sm",
}: {
  mode: SearchMode;
  size?: "sm" | "xs";
}) {
  const meta = MODE_META[mode];
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad}`}
      style={{
        color: meta.color,
        backgroundColor: `${meta.color}14`, // ~8% alpha tint
        border: `1px solid ${meta.color}33`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
