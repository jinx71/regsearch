"""Information-retrieval metrics for the benchmark harness.

All four are computed against a set of relevant document ids (binary
relevance). They answer different questions, which is exactly why the benchmark
reports all of them rather than a single number:

  precision@k  -- of the k results shown, what fraction were relevant?
  recall@k     -- of all relevant docs, what fraction made the top k?
  MRR          -- how high was the *first* relevant result? (rewards getting
                  one good answer to the top, which is what RAG cares about)
  nDCG@k       -- rank-weighted relevance, normalised so 1.0 is the ideal order.

Kept as plain functions over lists/sets so each one can be checked by hand
against a worked example (see tests/test_metrics.py).
"""
from __future__ import annotations

import math


def precision_at_k(ranked_ids: list[str], relevant: set[str], k: int) -> float:
    if k <= 0:
        return 0.0
    top = ranked_ids[:k]
    hits = sum(1 for doc_id in top if doc_id in relevant)
    return hits / k


def recall_at_k(ranked_ids: list[str], relevant: set[str], k: int) -> float:
    if not relevant:
        return 0.0
    top = ranked_ids[:k]
    hits = sum(1 for doc_id in top if doc_id in relevant)
    return hits / len(relevant)


def reciprocal_rank(ranked_ids: list[str], relevant: set[str]) -> float:
    for idx, doc_id in enumerate(ranked_ids, start=1):
        if doc_id in relevant:
            return 1.0 / idx
    return 0.0


def ndcg_at_k(ranked_ids: list[str], relevant: set[str], k: int) -> float:
    # DCG with binary gains: relevant -> 1, else 0, discounted by log2(rank+1).
    dcg = 0.0
    for idx, doc_id in enumerate(ranked_ids[:k], start=1):
        if doc_id in relevant:
            dcg += 1.0 / math.log2(idx + 1)
    # Ideal DCG: every relevant doc packed into the top positions.
    ideal_hits = min(len(relevant), k)
    idcg = sum(1.0 / math.log2(idx + 1) for idx in range(1, ideal_hits + 1))
    return (dcg / idcg) if idcg > 0 else 0.0
