import { useState } from "react";
import { Columns3 } from "lucide-react";
import type { CompareData } from "../types";
import { compare, errorMessage } from "../api/client";
import SearchBar from "../components/SearchBar";
import CompareColumns from "../components/CompareColumns";
import Banner from "../components/Banner";

const EXAMPLES = [
  "Stopping staff from altering results",
  "Recovering when a production run goes wrong",
  "Water purity standards for manufacturing",
];

export default function ComparePage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(q: string) {
    const text = q.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const res = await compare(text, 5);
      setData(res);
    } catch (err) {
      setError(errorMessage(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Compare retrieval modes
        </h1>
        <p className="text-ink-soft max-w-2xl">
          Run a single query through all four strategies at once and line the
          rankings up side by side. The same document often sits at very
          different ranks depending on how it's scored.
        </p>
      </section>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => run(query)}
        loading={loading}
        placeholder="One query, four rankings…"
      />

      {!data && !error && !loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-ink-faint">
            <Columns3 size={14} /> Example queries
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  run(ex);
                }}
                className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm text-ink-soft hover:border-brand hover:text-ink transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <Banner tone="loading">Scoring all four modes…</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      {data && (
        <section className="space-y-3">
          <p className="text-sm text-ink-soft">
            Results for{" "}
            <span className="font-medium text-ink">“{data.query}”</span> ·{" "}
            <span className="mono-num">{data.total_indexed}</span> documents
            indexed
          </p>
          <CompareColumns data={data} />
        </section>
      )}
    </div>
  );
}
