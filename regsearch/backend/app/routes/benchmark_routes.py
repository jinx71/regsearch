"""Benchmark endpoint: runs the IR evaluation across all modes on demand."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.benchmark import run_benchmark
from app.corpus import corpus
from app.models import BenchmarkData, Envelope

router = APIRouter(prefix="/api", tags=["benchmark"])


@router.get("/benchmark", response_model=Envelope[BenchmarkData])
def benchmark(k: int = Query(10, ge=1, le=20)) -> Envelope[BenchmarkData]:
    corpus.ensure_loaded()
    try:
        data = run_benchmark(k=k)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="qrels file not found") from exc
    return Envelope(
        success=True,
        data=data,
        message=f"evaluated {data.num_queries} queries @k={k}",
    )
