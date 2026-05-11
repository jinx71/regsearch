import type { SearchHit } from "../types";
import ResultCard from "./ResultCard";
import { normalizeScores } from "../lib/scores";

interface ResultsListProps {
  hits: SearchHit[];
  color: string;
}

export default function ResultsList({ hits, color }: ResultsListProps) {
  const norms = normalizeScores(hits);
  return (
    <div className="space-y-3">
      {hits.map((hit, i) => (
        <ResultCard
          key={`${hit.id}-${i}`}
          hit={hit}
          color={color}
          normalized={norms[i]}
          index={i}
        />
      ))}
    </div>
  );
}
