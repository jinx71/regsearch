"""Seed script: build the dense index in Qdrant from the corpus file.

Run once after Qdrant is up:

    python -m scripts.seed

It embeds every document with the bi-encoder and upserts the vectors. The first
run downloads the ONNX embedding model (~130MB), which fastembed caches, so
subsequent runs are fast.
"""
from __future__ import annotations

from app.ingest import ingest


def main() -> None:
    print("Loading corpus and embedding documents (first run downloads the model)...")
    count = ingest()
    print(f"Done. Indexed {count} documents into Qdrant.")


if __name__ == "__main__":
    main()
