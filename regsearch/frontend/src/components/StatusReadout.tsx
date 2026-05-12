import { useEffect, useState } from "react";
import { health } from "../api/client";
import type { HealthData } from "../types";

// Small instrument-style readout in the header. Reports corpus size and
// whether the dense index (Qdrant) has been seeded. Fails quietly — the app
// still works for keyword search without the backend's vector store.
export default function StatusReadout() {
  const [data, setData] = useState<HealthData | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let alive = true;
    health()
      .then((d) => alive && setData(d))
      .catch(() => alive && setErrored(true));
    return () => {
      alive = false;
    };
  }, []);

  const dotClass = errored
    ? "bg-rerank"
    : data
      ? data.vectors_indexed > 0
        ? "bg-semantic"
        : "bg-keyword"
      : "bg-ink-faint animate-pulse";

  let label = "connecting…";
  if (errored) label = "API offline";
  else if (data) {
    label =
      data.vectors_indexed > 0
        ? `${data.corpus_loaded} docs · ${data.vectors_indexed} vectors`
        : `${data.corpus_loaded} docs · index not seeded`;
  }

  return (
    <div className="hidden sm:flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="font-mono text-xs text-ink-soft">{label}</span>
    </div>
  );
}
