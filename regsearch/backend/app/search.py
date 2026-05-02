"""The search orchestrator.

One service, four modes, each building on the last:

  keyword        BM25 over the in-memory lexical index.
  semantic       dense kNN from Qdrant.
  hybrid         RRF fusion of the keyword and semantic rankings.
  hybrid_rerank  hybrid candidates re-scored by the cross-encoder.

Each retriever first pulls `candidate_pool` results; fusion/reranking then
operate on that pool before the final `top_k` is returned. Keeping the pool
wider than top_k is what lets a doc ranked, say, #18 by BM25 but #2 by the
cross-encoder surface to the top -- the behaviour the benchmark quantifies.
"""
from __future__ import annotations

import time

from app.config import settings
from app.corpus import corpus
from app.embeddings import embedder
from app.fusion import reciprocal_rank_fusion
from app.models import ModeResult, SearchHit, SearchMode
from app.reranker import reranker
from app.vectordb import vector_store


def _to_hits(
    scored: list[tuple[str, float]],
    query: str,
    with_matched_terms: bool,
) -> list[SearchHit]:
    """Hydrate (doc_id, score) pairs into full SearchHit objects."""
    hits: list[SearchHit] = []
    for rank, (doc_id, score) in enumerate(scored, start=1):
        doc = corpus.get(doc_id)
        if doc is None:
            continue  # vector store and corpus drifted; skip defensively
        matched = corpus.bm25.matched_terms(query, doc_id) if with_matched_terms else []
        hits.append(
            SearchHit(
                **doc.model_dump(),
                score=round(float(score), 6),
                rank=rank,
                matched_terms=matched,
            )
        )
    return hits


class SearchService:
    def keyword(self, query: str, top_k: int) -> list[tuple[str, float]]:
        return corpus.bm25.search(query, top_k)

    def semantic(self, query: str, top_k: int) -> list[tuple[str, float]]:
        vector = embedder.embed_query(query)
        return vector_store.search(vector, top_k)

    def hybrid(self, query: str, top_k: int) -> list[tuple[str, float]]:
        pool = settings.candidate_pool
        kw = self.keyword(query, pool)
        sem = self.semantic(query, pool)
        fused = reciprocal_rank_fusion(
            [[doc_id for doc_id, _ in kw], [doc_id for doc_id, _ in sem]],
            k=settings.rrf_k,
        )
        return fused[:top_k]

    def hybrid_rerank(self, query: str, top_k: int) -> list[tuple[str, float]]:
        # Rerank a wider pool than we'll return, so the cross-encoder can
        # promote candidates the first stage ranked low.
        pool = settings.candidate_pool
        fused = self.hybrid(query, pool)
        doc_ids = [doc_id for doc_id, _ in fused]
        passages = [corpus.get(d).text for d in doc_ids if corpus.get(d)]
        if not passages:
            return []
        scores = reranker.rerank(query, passages)
        reranked = sorted(zip(doc_ids, scores), key=lambda kv: kv[1], reverse=True)
        return reranked[:top_k]

    def run(self, query: str, mode: SearchMode, top_k: int) -> list[tuple[str, float]]:
        dispatch = {
            SearchMode.keyword: self.keyword,
            SearchMode.semantic: self.semantic,
            SearchMode.hybrid: self.hybrid,
            SearchMode.hybrid_rerank: self.hybrid_rerank,
        }
        return dispatch[mode](query, top_k)

    def search(self, query: str, mode: SearchMode, top_k: int) -> tuple[list[SearchHit], float]:
        """Run one mode and return (hits, elapsed_ms)."""
        start = time.perf_counter()
        scored = self.run(query, mode, top_k)
        took_ms = (time.perf_counter() - start) * 1000
        with_terms = mode in (SearchMode.keyword, SearchMode.hybrid, SearchMode.hybrid_rerank)
        return _to_hits(scored, query, with_terms), round(took_ms, 2)

    def compare(self, query: str, top_k: int) -> dict[SearchMode, ModeResult]:
        """Run every mode for the same query (powers the side-by-side view)."""
        out: dict[SearchMode, ModeResult] = {}
        for mode in SearchMode:
            hits, took_ms = self.search(query, mode, top_k)
            out[mode] = ModeResult(took_ms=took_ms, results=hits)
        return out


search_service = SearchService()
