"""Qdrant vector store wrapper.

Qdrant is the dense half of the system: it stores one 384-dim vector per
document plus the document payload, and serves cosine-similarity nearest
neighbours. It was chosen over an in-process index (FAISS/Chroma-embedded)
because it is a real networked service with payload filtering and a free cloud
tier, so the same code runs locally (Docker) and in deployment unchanged.

The lexical (BM25) side is kept separate in-process so the retrieval mechanics
stay visible; Qdrant could also hold sparse vectors, which is the scaling path.
"""
from __future__ import annotations

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
)

from app.config import settings
from app.models import Document


class VectorStore:
    def __init__(self) -> None:
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
        self.collection = settings.collection_name

    def recreate_collection(self) -> None:
        """Drop and recreate the collection (used by the seed script)."""
        self.client.recreate_collection(
            collection_name=self.collection,
            vectors_config=VectorParams(
                size=settings.embedding_dim,
                distance=Distance.COSINE,
            ),
        )

    def collection_exists(self) -> bool:
        return self.client.collection_exists(self.collection)

    def count(self) -> int:
        if not self.collection_exists():
            return 0
        return self.client.count(self.collection).count

    def upsert(self, docs: list[Document], vectors: list[list[float]]) -> None:
        """Index documents. Qdrant point ids must be int/UUID, so the human-
        readable doc id is carried in the payload and used everywhere else."""
        points = [
            PointStruct(
                id=idx,
                vector=vector,
                payload=doc.model_dump(),
            )
            for idx, (doc, vector) in enumerate(zip(docs, vectors))
        ]
        self.client.upsert(collection_name=self.collection, points=points)

    def search(self, vector: list[float], top_k: int) -> list[tuple[str, float]]:
        """Return [(doc_id, cosine_score)] for the nearest neighbours."""
        hits = self.client.query_points(
            collection_name=self.collection,
            query=vector,
            limit=top_k,
            with_payload=True,
        ).points
        return [(hit.payload["id"], hit.score) for hit in hits]


vector_store = VectorStore()
