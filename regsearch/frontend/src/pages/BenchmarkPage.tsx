import { useState } from "react";
import { Play, TrendingUp } from "lucide-react";
import type { BenchmarkData } from "../types";
import { MODE_META } from "../types";
import { benchmark, errorMessage } from "../api/client";
import BenchmarkChart from "../components/BenchmarkChart";
import MetricsTable from "../components/MetricsTable";
import Banner from "../components/Banner";

export default function BenchmarkPage() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [k, setK] = useState(10);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await benchmark(k);
      setData(res);
    } catch (err) {
      setError(errorMessage(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // Headline: how much nDCG the best mode adds over the keyword baseline.
  const headline = (() => {
    if (!data) return null;
    const base = data.modes.keyword.ndcg_at_k;
    let bestMode = "keyword" as keyof typeof MODE_META;
    let bestVal = -Infinity;
    for (const m of Object.keys(data.modes) as (keyof typeof MODE_META)[]) {
      const v = data.modes[m].ndcg_at_k;
      if (v > bestVal) {
        bestVal = v;
        bestMode = m;
      }
    }
    const lift =
      base > 0 ? ((bestVal - base) / base) * 100 : bestVal > 0 ? 100 : 0;
    return { bestMode, bestVal, base, lift };
  })();

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Retrieval benchmark
        </h1>
        <p className="text-ink-soft max-w-2xl">
          Evaluates every mode against a hand-built set of judged queries
          (qrels) using standard information-retrieval metrics. The golden set
          is written so relevant documents use{" "}
          <span className="font-medium">different words</span> than the queries
          — exactly where lexical search struggles.
        </p>
      </section>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-ink-soft">
            Cutoff k
          </label>
          <div className="inline-flex rounded-lg border border-line bg-panel p-1">
            {[5, 10, 15].map((opt) => (
              <button
                key={opt}
                onClick={() => setK(opt)}
                className="rounded-md px-3 py-1 text-sm font-mono transition-colors"
                style={
                  k === opt
                    ? { backgroundColor: "#0F2438", color: "#fff" }
                    : { color: "#3B4D5F" }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-brand transition-colors disabled:opacity-50"
        >
          <Play size={15} />
          {loading ? "Evaluating…" : data ? "Re-run" : "Run benchmark"}
        </button>
      </div>

      {loading && (
        <Banner tone="loading">
          Scoring {4} modes across the judged query set…
        </Banner>
      )}
      {error && (
        <Banner tone="error">
          {error}
          <div className="mt-1 text-xs text-ink-faint">
            The benchmark needs the dense index seeded (Qdrant). See the README
            for the seed step.
          </div>
        </Banner>
      )}

      {data && headline && (
        <section className="space-y-5">
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: `${MODE_META[headline.bestMode].color}40`,
              backgroundColor: `${MODE_META[headline.bestMode].color}0A`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="grid place-items-center h-10 w-10 rounded-lg shrink-0"
                style={{
                  backgroundColor: `${MODE_META[headline.bestMode].color}1A`,
                  color: MODE_META[headline.bestMode].color,
                }}
              >
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-ink">
                  <span
                    className="font-display font-bold"
                    style={{ color: MODE_META[headline.bestMode].color }}
                  >
                    {MODE_META[headline.bestMode].label}
                  </span>{" "}
                  leads on nDCG@{data.k} with a score of{" "}
                  <span className="mono-num font-semibold">
                    {headline.bestVal.toFixed(4)}
                  </span>
                  .
                </p>
                <p className="text-sm text-ink-soft mt-1">
                  That's{" "}
                  <span className="mono-num font-semibold text-ink">
                    {headline.lift >= 0 ? "+" : ""}
                    {headline.lift.toFixed(0)}%
                  </span>{" "}
                  over the keyword baseline (
                  <span className="mono-num">{headline.base.toFixed(4)}</span>),
                  across{" "}
                  <span className="mono-num">{data.num_queries}</span> judged
                  queries.
                </p>
              </div>
            </div>
          </div>

          <BenchmarkChart data={data} />
          <MetricsTable data={data} />

          <p className="text-xs text-ink-faint leading-relaxed">
            Precision@k = fraction of the top-k that are relevant · Recall@k =
            fraction of all relevant docs found in the top-k · MRR = mean
            reciprocal rank of the first relevant hit · nDCG@k = rank-weighted
            relevance vs. the ideal ordering. All metrics macro-averaged over the
            query set.
          </p>
        </section>
      )}

      {!data && !loading && !error && (
        <Banner tone="info">
          Run the benchmark to score keyword, semantic, hybrid and reranking
          against the judged query set. Requires the dense index to be seeded.
        </Banner>
      )}
    </div>
  );
}
