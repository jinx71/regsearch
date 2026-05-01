"""FastAPI application factory.

`create_app()` builds the app without binding a port; uvicorn (or the test
client) owns the transport. Same separation-of-concerns idea as splitting an
Express app from its server -- it keeps the app importable and testable.

The corpus (and BM25 index) loads on startup so lexical search is warm
immediately. Dense search additionally needs Qdrant populated via the seed
script; the /api/health endpoint reports whether that has happened.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.corpus import corpus
from app.models import Envelope
from app.routes import benchmark_routes, search_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm the in-memory corpus + BM25 index on boot. Wrapped so a missing
    # data file during local experimentation doesn't crash the process.
    try:
        corpus.load()
    except FileNotFoundError:
        pass
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="RegSearch API",
        description=(
            "A semantic search engine over pharmaceutical/GMP regulatory "
            "documents. Compares BM25, dense, hybrid (RRF) and cross-encoder "
            "reranking, with an IR benchmark."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.client_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(search_routes.router)
    app.include_router(benchmark_routes.router)

    @app.get("/api/health", response_model=Envelope[dict], tags=["health"])
    def health() -> Envelope[dict]:
        from app.vectordb import vector_store

        try:
            indexed = vector_store.count()
            qdrant_ok = True
        except Exception:
            indexed, qdrant_ok = 0, False

        return Envelope(
            success=True,
            data={
                "corpus_loaded": corpus.size,
                "vectors_indexed": indexed,
                "qdrant_reachable": qdrant_ok,
            },
            message="ok",
        )

    return app


app = create_app()
