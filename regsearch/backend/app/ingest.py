"""Ingestion pipeline.

One function, three steps: load the corpus into memory (which also builds the
BM25 index), embed every document with the bi-encoder, and upsert the vectors
into a freshly recreated Qdrant collection. Called by scripts/seed.py and
exposed through an admin endpoint so the index can be rebuilt without shelling
into the server.
"""
from __future__ import annotations

from app.corpus import corpus
from app.embeddings import embedder
from app.vectordb import vector_store


def ingest() -> int:
    """(Re)build the dense index from the corpus. Returns docs indexed."""
    corpus.load()
    docs = corpus.all()

    vector_store.recreate_collection()
    vectors = embedder.embed_documents([d.text for d in docs])
    vector_store.upsert(docs, vectors)

    return len(docs)
