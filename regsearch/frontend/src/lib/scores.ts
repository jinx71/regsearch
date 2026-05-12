import type { SearchHit } from "../types";

// Normalize hit scores to 0..1 within a single result list so the signal bars
// are comparable *within* a mode. Different modes use different score scales
// (BM25 magnitudes, cosine similarity, RRF sums, cross-encoder logits), so we
// deliberately do not normalize across modes — only within one ranked list.
export function normalizeScores(hits: SearchHit[]): number[] {
  if (hits.length === 0) return [];
  const scores = hits.map((h) => h.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const span = max - min;
  return scores.map((s) => {
    if (span <= 1e-9) return 1; // all equal -> full bars
    // Keep the top result near full, but let the floor breathe a little.
    return 0.15 + 0.85 * ((s - min) / span);
  });
}
