"""In-memory corpus: the source of truth for document text and the BM25 index.

Qdrant stores vectors; this holds the actual documents (for hydrating results
into full hits) and the lexical index. Both are built once from corpus.jsonl
when the API starts. For a demo corpus this is trivial in size; the loader is
intentionally simple so the data path is obvious.
"""
from __future__ import annotations

import json
from pathlib import Path

from app.bm25 import BM25Index
from app.config import settings
from app.models import Document


class Corpus:
    def __init__(self) -> None:
        self.docs: dict[str, Document] = {}
        self.bm25 = BM25Index(k1=settings.bm25_k1, b=settings.bm25_b)
        self._loaded = False

    def load(self, path: Path | None = None) -> None:
        path = path or settings.corpus_path
        self.docs.clear()
        self.bm25 = BM25Index(k1=settings.bm25_k1, b=settings.bm25_b)

        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                doc = Document(**json.loads(line))
                self.docs[doc.id] = doc
                # BM25 indexes title + body so titles carry lexical weight.
                self.bm25.add(doc.id, f"{doc.title}. {doc.text}")

        self.bm25.finalize()
        self._loaded = True

    def ensure_loaded(self) -> None:
        if not self._loaded:
            self.load()

    def get(self, doc_id: str) -> Document | None:
        return self.docs.get(doc_id)

    def all(self) -> list[Document]:
        return list(self.docs.values())

    @property
    def size(self) -> int:
        return len(self.docs)


corpus = Corpus()
