"""Request/response schemas.

Every endpoint returns the project-standard envelope: { success, data, message }.
`Envelope` is generic so the typed `data` payload travels with it into the
OpenAPI schema and the frontend types stay honest.
"""
from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class SearchMode(str, Enum):
    keyword = "keyword"  # BM25 only (lexical baseline)
    semantic = "semantic"  # dense vectors only
    hybrid = "hybrid"  # RRF fusion of keyword + semantic
    hybrid_rerank = "hybrid_rerank"  # hybrid, then cross-encoder rerank


class Document(BaseModel):
    id: str
    title: str
    text: str
    category: str
    source: str


class SearchHit(Document):
    score: float = Field(..., description="Score in the mode's native scale")
    rank: int = Field(..., description="1-based rank in the returned list")
    matched_terms: list[str] = Field(
        default_factory=list,
        description="Query terms that lexically matched (keyword/hybrid only)",
    )


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=512)
    mode: SearchMode = SearchMode.hybrid_rerank
    top_k: int = Field(10, ge=1, le=50)


class CompareRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=512)
    top_k: int = Field(5, ge=1, le=20)


class SearchData(BaseModel):
    query: str
    mode: SearchMode
    took_ms: float
    total_indexed: int
    results: list[SearchHit]


class ModeResult(BaseModel):
    took_ms: float
    results: list[SearchHit]


class CompareData(BaseModel):
    query: str
    total_indexed: int
    modes: dict[SearchMode, ModeResult]


class MetricScores(BaseModel):
    precision_at_k: float
    recall_at_k: float
    mrr: float
    ndcg_at_k: float


class BenchmarkData(BaseModel):
    k: int
    num_queries: int
    modes: dict[SearchMode, MetricScores]


class Envelope(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    message: str = ""
