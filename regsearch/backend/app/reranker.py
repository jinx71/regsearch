"""Cross-encoder reranking via fastembed.

The distinction this module exists to demonstrate:

  Bi-encoder (embeddings)  -- encodes query and document *separately* into
    vectors, then compares with cosine. Fast, lets you pre-index millions of
    docs, but the two texts never "see" each other.

  Cross-encoder (reranker) -- feeds the query and a candidate document through
    the model *together* and outputs one relevance score. Far more accurate,
    but far too slow to run over a whole corpus.

So the pipeline uses the bi-encoder (plus BM25) to cheaply shortlist a few
dozen candidates, then spends the cross-encoder only on that shortlist. This is
the standard retrieve-then-rerank pattern; here it is explicit rather than
hidden inside a framework.

Lazy-loaded, same as the embedder.
"""
from __future__ import annotations

from fastembed.rerank.cross_encoder import TextCrossEncoder

from app.config import settings


class Reranker:
    def __init__(self, model_name: str | None = None) -> None:
        self._model_name = model_name or settings.reranker_model
        self._model: TextCrossEncoder | None = None

    @property
    def model(self) -> TextCrossEncoder:
        if self._model is None:
            self._model = TextCrossEncoder(model_name=self._model_name)
        return self._model

    def rerank(self, query: str, documents: list[str]) -> list[float]:
        """Return a relevance score per document, aligned to input order."""
        if not documents:
            return []
        return list(self.model.rerank(query, documents))


reranker = Reranker()
