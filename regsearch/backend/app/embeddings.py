"""Dense embeddings via fastembed.

Why fastembed over sentence-transformers: it runs the embedding model through
ONNX Runtime with no torch dependency. That keeps the Docker image small and
cold starts fast -- the same lean-deployment reasoning used elsewhere in this
portfolio (ONNX over a multi-GB torch install).

The model is loaded lazily on first use, not at import. That keeps module
import cheap, lets the pure-logic test suite run without ever downloading a
model, and means the API process only pays the load cost once a query actually
arrives.
"""
from __future__ import annotations

from collections.abc import Iterable

from fastembed import TextEmbedding

from app.config import settings


class Embedder:
    def __init__(self, model_name: str | None = None) -> None:
        self._model_name = model_name or settings.embedding_model
        self._model: TextEmbedding | None = None

    @property
    def model(self) -> TextEmbedding:
        if self._model is None:
            self._model = TextEmbedding(model_name=self._model_name)
        return self._model

    def embed_documents(self, texts: Iterable[str]) -> list[list[float]]:
        """Embed a batch of passages for indexing."""
        return [vec.tolist() for vec in self.model.embed(list(texts))]

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query.

        bge models are trained with an instruction prefix on the query side;
        applying it lifts retrieval quality noticeably for short queries.
        """
        prefixed = f"Represent this sentence for searching relevant passages: {text}"
        return next(iter(self.model.query_embed(prefixed))).tolist()


# Module-level singleton: one model load shared across requests.
embedder = Embedder()
