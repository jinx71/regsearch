import { FileText } from "lucide-react";
import type { SearchHit } from "../types";
import SignalBar from "./SignalBar";
import Highlight from "./Highlight";

interface ResultCardProps {
  hit: SearchHit;
  color: string;
  // Normalized 0..1 relative to the top hit in this list.
  normalized: number;
  index: number;
  compact?: boolean;
}

export default function ResultCard({
  hit,
  color,
  normalized,
  index,
  compact,
}: ResultCardProps) {
  return (
    <article
      className="panel p-4 animate-fade-rise"
      style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Rank index, mono, in the result's channel color. */}
        <div
          className="mono-num shrink-0 grid place-items-center h-7 w-7 rounded-md text-sm font-semibold"
          style={{ backgroundColor: `${color}14`, color }}
        >
          {hit.rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-semibold text-ink leading-snug">
              {hit.title}
            </h3>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="chip">
              <FileText size={11} />
              {hit.source}
            </span>
            <span className="chip">{hit.category}</span>
            <span className="chip font-mono">{hit.id}</span>
          </div>

          {!compact && (
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
              <Highlight text={hit.text} terms={hit.matched_terms} color={color} />
            </p>
          )}

          {compact && (
            <p className="mt-2 text-xs leading-relaxed text-ink-soft line-clamp-2">
              <Highlight
                text={hit.text}
                terms={hit.matched_terms}
                color={color}
                maxLen={140}
              />
            </p>
          )}

          <div className="mt-3">
            <SignalBar value={normalized} color={color} score={hit.score} />
          </div>
        </div>
      </div>
    </article>
  );
}
