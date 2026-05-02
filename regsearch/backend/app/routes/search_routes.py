"""Search-related endpoints.

All responses use the { success, data, message } envelope. The corpus is loaded
lazily on first request via `corpus.ensure_loaded()` so the routes work in
tests without a startup hook.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.corpus import corpus
from app.ingest import ingest
from app.models import (
    CompareData,
    CompareRequest,
    Document,
    Envelope,
    SearchData,
    SearchRequest,
)
from app.search import search_service

router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search", response_model=Envelope[SearchData])
def search(req: SearchRequest) -> Envelope[SearchData]:
    corpus.ensure_loaded()
    hits, took_ms = search_service.search(req.query, req.mode, req.top_k)
    data = SearchData(
        query=req.query,
        mode=req.mode,
        took_ms=took_ms,
        total_indexed=corpus.size,
        results=hits,
    )
    return Envelope(success=True, data=data, message=f"{len(hits)} results")


@router.post("/compare", response_model=Envelope[CompareData])
def compare(req: CompareRequest) -> Envelope[CompareData]:
    corpus.ensure_loaded()
    modes = search_service.compare(req.query, req.top_k)
    data = CompareData(query=req.query, total_indexed=corpus.size, modes=modes)
    return Envelope(success=True, data=data, message="compared 4 modes")


@router.get("/documents", response_model=Envelope[list[Document]])
def list_documents() -> Envelope[list[Document]]:
    corpus.ensure_loaded()
    docs = corpus.all()
    return Envelope(success=True, data=docs, message=f"{len(docs)} documents")


@router.post("/reindex", response_model=Envelope[dict], tags=["admin"])
def reindex() -> Envelope[dict]:
    """Rebuild the dense index in Qdrant from the corpus file."""
    try:
        count = ingest()
    except Exception as exc:  # surface the cause instead of a bare 500
        raise HTTPException(status_code=503, detail=f"Reindex failed: {exc}") from exc
    return Envelope(success=True, data={"indexed": count}, message="reindex complete")
