// Mirrors the backend pydantic schemas in app/models.py. Kept in sync by hand
// so the API contract is visible on both sides (no codegen dependency).

export type SearchMode = "keyword" | "semantic" | "hybrid" | "hybrid_rerank";

export interface Document {
  id: string;
  title: string;
  text: string;
  category: string;
  source: string;
}

export interface SearchHit extends Document {
  score: number;
  rank: number;
  matched_terms: string[];
}

export interface SearchData {
  query: string;
  mode: SearchMode;
  took_ms: number;
  total_indexed: number;
  results: SearchHit[];
}

export interface ModeResult {
  took_ms: number;
  results: SearchHit[];
}

export interface CompareData {
  query: string;
  total_indexed: number;
  modes: Record<SearchMode, ModeResult>;
}

export interface MetricScores {
  precision_at_k: number;
  recall_at_k: number;
  mrr: number;
  ndcg_at_k: number;
}

export interface BenchmarkData {
  k: number;
  num_queries: number;
  modes: Record<SearchMode, MetricScores>;
}

export interface HealthData {
  corpus_loaded: number;
  vectors_indexed: number;
  qdrant_reachable: boolean;
}

// The project-standard response envelope: { success, data, message }.
export interface Envelope<T> {
  success: boolean;
  data: T | null;
  message: string;
}

// ---- View helpers shared across pages -------------------------------------

export const MODE_ORDER: SearchMode[] = [
  "keyword",
  "semantic",
  "hybrid",
  "hybrid_rerank",
];

export interface ModeMeta {
  label: string;
  short: string;
  // Tailwind-friendly hex; also used directly by Recharts.
  color: string;
  blurb: string;
}

export const MODE_META: Record<SearchMode, ModeMeta> = {
  keyword: {
    label: "Keyword",
    short: "BM25",
    color: "#B45309",
    blurb: "Okapi BM25 lexical match. Fast, exact, vocabulary-bound.",
  },
  semantic: {
    label: "Semantic",
    short: "Dense",
    color: "#0E7490",
    blurb: "Dense embeddings + cosine kNN. Matches meaning, not words.",
  },
  hybrid: {
    label: "Hybrid",
    short: "RRF",
    color: "#6D28D9",
    blurb: "Reciprocal Rank Fusion of keyword + semantic rankings.",
  },
  hybrid_rerank: {
    label: "Hybrid + Rerank",
    short: "Rerank",
    color: "#BE123C",
    blurb: "Hybrid candidates re-scored by a cross-encoder reranker.",
  },
};

export const METRIC_LABELS: { key: keyof MetricScores; label: string }[] = [
  { key: "precision_at_k", label: "Precision@k" },
  { key: "recall_at_k", label: "Recall@k" },
  { key: "mrr", label: "MRR" },
  { key: "ndcg_at_k", label: "nDCG@k" },
];
