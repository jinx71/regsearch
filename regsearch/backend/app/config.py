"""Application configuration.

All tunables live here so the search/retrieval behaviour can be changed from
the environment without touching code. Values are read once at import time.
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/  -> two levels up from this file (app/config.py)
BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Qdrant ---
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None  # required only for Qdrant Cloud
    collection_name: str = "reg_documents"

    # --- Models (downloaded on first use by fastembed, cached locally) ---
    # bge-small is 384-dim, ONNX, ~130MB on disk and runs without torch.
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dim: int = 384
    # Cross-encoder used only to rerank the top candidates of a hybrid query.
    reranker_model: str = "Xenova/ms-marco-MiniLM-L-6-v2"

    # --- Retrieval tuning ---
    bm25_k1: float = 1.5
    bm25_b: float = 0.75
    rrf_k: int = 60  # rank-fusion smoothing constant
    candidate_pool: int = 30  # how many to pull per retriever before fusion/rerank
    default_top_k: int = 10

    # --- Data files ---
    corpus_path: Path = DATA_DIR / "corpus.jsonl"
    qrels_path: Path = DATA_DIR / "qrels.json"

    # --- CORS ---
    client_url: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
