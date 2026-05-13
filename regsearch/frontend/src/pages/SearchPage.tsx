import { useState } from "react";
import { Clock, Database, Sparkles } from "lucide-react";
import type { SearchData, SearchMode } from "../types";
import { MODE_META } from "../types";
import { search, errorMessage } from "../api/client";
import SearchBar from "../components/SearchBar";
import ModeSelector from "../components/ModeSelector";
import ResultsList from "../components/ResultsList";
import Banner from "../components/Banner";

// Queries deliberately phrased in different vocabulary than the documents, to
// show where semantic retrieval pulls ahead of keyword matching.
const EXAMPLES = [
  "How do we stop people fudging records?",
  "Keeping the cleanroom air clean enough",
  "Proving a machine does what it should before use",
  "What to do when a batch fails its checks",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("hybrid_rerank");
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(q: string, m: SearchMode) {
    const text = q.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const res = await search(text, m, 10);
      setData(res);
    } catch (err) {
      setError(errorMessage(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const color = MODE_META[mode].color;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Search the regulatory corpus
        </h1>
        <p className="text-ink-soft max-w-2xl">
          A semantic search engine over GMP / pharmaceutical quality documents.
          Switch retrieval strategies to feel the difference between matching{" "}
          <span className="font-medium">words</span> and matching{" "}
          <span className="font-medium">meaning</span>.
        </p>
      </section>

      <div className="space-y-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => runSearch(query, mode)}
          loading={loading}
        />
        <ModeSelector
          value={mode}
          onChange={(m) => {
            setMode(m);
            if (data) runSearch(query, m); // re-run so the comparison is live
          }}
        />
      </div>

      {!data && !error && !loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-ink-faint">
            <Sparkles size={14} /> Try one of these
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  runSearch(ex, mode);
                }}
                className="text-left rounded-lg border border-line bg-panel px-3.5 py-2.5 text-sm text-ink-soft hover:border-brand hover:text-ink transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <Banner tone="loading">Running {MODE_META[mode].label} retrieval…</Banner>}

      {error && (
        <Banner tone="error">
          {error}
          <div className="mt-1 text-xs text-ink-faint">
            Keyword search works without the vector store; semantic / hybrid
            modes need Qdrant seeded (see the project README).
          </div>
        </Banner>
      )}

      {data && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-mono font-medium text-ink">
                {data.results.length}
              </span>
              results
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-ink-faint" />
              <span className="mono-num">{data.took_ms.toFixed(1)} ms</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Database size={13} className="text-ink-faint" />
              <span className="mono-num">{data.total_indexed}</span> indexed
            </span>
          </div>

          {data.results.length === 0 ? (
            <Banner tone="info">No documents matched that query.</Banner>
          ) : (
            <ResultsList hits={data.results} color={color} />
          )}
        </section>
      )}
    </div>
  );
}
