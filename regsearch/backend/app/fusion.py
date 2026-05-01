"""Reciprocal Rank Fusion (RRF).

Fuses several ranked lists into one without needing the scores to share a scale.
That property is the whole point here: BM25 scores and cosine similarities are
not comparable numbers, but their *ranks* are. RRF sidesteps score
normalisation entirely.

    rrf_score(d) = sum over rankers r of  1 / (k + rank_r(d))

`rank_r(d)` is 1-based; documents missing from a list contribute nothing. `k`
(default 60, from the original Cormack et al. paper) damps the influence of the
very top ranks so a single retriever cannot dominate the fused order.
"""
from __future__ import annotations


def reciprocal_rank_fusion(
    ranked_lists: list[list[str]], k: int = 60
) -> list[tuple[str, float]]:
    """Fuse ranked id-lists into [(doc_id, rrf_score)] sorted descending.

    Args:
        ranked_lists: each inner list is doc_ids in rank order (best first).
        k: RRF smoothing constant.
    """
    scores: dict[str, float] = {}
    for ranking in ranked_lists:
        for rank, doc_id in enumerate(ranking, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
