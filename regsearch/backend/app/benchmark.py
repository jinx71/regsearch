"""Benchmark harness.

Loads golden relevance judgments (qrels: query -> set of relevant doc ids),
runs every search mode over every query, scores each result list with the IR
metrics, and macro-averages across queries. The output is what turns "semantic
search feels better" into "hybrid+rerank lifts nDCG@10 from X to Y over the
keyword baseline" -- a defensible claim for a portfolio README.

Macro-averaging (mean of per-query scores) is used rather than micro-averaging
so every query counts equally regardless of how many relevant docs it has.
"""
from __future__ import annotations

import json
from pathlib import Path

from app.config import settings
from app.metrics import ndcg_at_k, precision_at_k, recall_at_k, reciprocal_rank
from app.models import BenchmarkData, MetricScores, SearchMode
from app.search import search_service


def load_qrels(path: Path | None = None) -> dict[str, set[str]]:
    path = path or settings.qrels_path
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    # File format: [{ "query": "...", "relevant": ["id1", "id2"] }, ...]
    return {item["query"]: set(item["relevant"]) for item in raw}


def run_benchmark(k: int = 10) -> BenchmarkData:
    qrels = load_qrels()
    queries = list(qrels.keys())

    mode_scores: dict[SearchMode, MetricScores] = {}
    for mode in SearchMode:
        p_sum = r_sum = mrr_sum = ndcg_sum = 0.0
        for query in queries:
            relevant = qrels[query]
            scored = search_service.run(query, mode, k)
            ranked_ids = [doc_id for doc_id, _ in scored]
            p_sum += precision_at_k(ranked_ids, relevant, k)
            r_sum += recall_at_k(ranked_ids, relevant, k)
            mrr_sum += reciprocal_rank(ranked_ids, relevant)
            ndcg_sum += ndcg_at_k(ranked_ids, relevant, k)

        n = len(queries) or 1
        mode_scores[mode] = MetricScores(
            precision_at_k=round(p_sum / n, 4),
            recall_at_k=round(r_sum / n, 4),
            mrr=round(mrr_sum / n, 4),
            ndcg_at_k=round(ndcg_sum / n, 4),
        )

    return BenchmarkData(k=k, num_queries=len(queries), modes=mode_scores)
