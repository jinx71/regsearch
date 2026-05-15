# RegSearch — Semantic Search Engine

> Semantic search over a corpus of pharmaceutical / GMP regulatory documents.
> Four retrieval strategies — **BM25**, **dense vectors**, **hybrid (RRF fusion)**,
> and **cross-encoder reranking** — compared side by side and scored with a real
> information-retrieval benchmark.

This project is deliberately about the **mechanics underneath RAG**: how lexical
and semantic retrieval actually differ, how you fuse two rankings, how a reranker
changes the order, and how you *measure* whether any of it helped. There is no
LLM generation here — it's pure retrieval, which is the part most "chatbot"
portfolios skip over.

**Live demo:** _add your deployed URL here_
**Screenshots:** _add `docs/search.png`, `docs/compare.png`, `docs/benchmark.png`_

---

## Why this project

Most AI portfolios are thin wrappers around a chat completion endpoint. Retrieval
quality — not the model — is what makes or breaks those systems in production. RegSearch
makes the retrieval layer visible and measurable:

- **Keyword (BM25)** matches *words*. Fast and exact, but blind to synonyms.
- **Semantic (dense)** matches *meaning* via embeddings, but can drift on exact terms/codes.
- **Hybrid (RRF)** fuses both rankings so each covers the other's blind spot.
- **Hybrid + Rerank** re-scores the fused candidates with a cross-encoder for precision at the top.

The golden query set is written so that relevant documents use **different vocabulary
than the query** (e.g. the query "how do we stop people fudging records" should surface
the *data integrity / audit trail / electronic records* documents, which never use the
word "fudging"). That's the exact situation where semantic retrieval pulls ahead of
keyword search — and the benchmark quantifies by how much.

---

## What's hand-rolled vs. library

The retrieval *primitives* are implemented from scratch and unit-tested, so the
mechanics are inspectable rather than hidden behind a framework. Heavy ML inference
uses a purpose-built library.

| Piece | Implementation | Why |
|---|---|---|
| **Okapi BM25** | Hand-written (`app/bm25.py`) | The lexical baseline. Writing the IDF / term-frequency saturation by hand makes the scoring explainable in an interview instead of a black box. |
| **Reciprocal Rank Fusion** | Hand-written (`app/fusion.py`) | Combining two rankings is the heart of hybrid search; it's ~15 lines and worth understanding directly. |
| **IR metrics** | Hand-written (`app/metrics.py`) | Precision@k, Recall@k, MRR, nDCG@k — implemented so the benchmark numbers are defensible, not magic. |
| **Dense embeddings** | `fastembed` (ONNX) | `BAAI/bge-small-en-v1.5`, 384-dim. ONNX runtime means **no PyTorch** in the image — a much leaner deploy. |
| **Cross-encoder rerank** | `fastembed` (ONNX) | `Xenova/ms-marco-MiniLM-L-6-v2`. A bi-encoder retrieves; a cross-encoder reads query+doc *together* for a sharper final score. |
| **Vector store** | Qdrant | Production-grade ANN index; cosine similarity over the dense vectors. |

> **Why ONNX over PyTorch:** `fastembed` runs the embedding and reranker models through
> ONNX Runtime, so the container doesn't carry the multi-GB torch + CUDA stack. The
> trade-off is a ~130 MB model download on first use (then cached). This mirrors the
> "ship the lean artifact" choice used elsewhere in the portfolio.

> **Why keep BM25 in-process rather than in Qdrant:** running the lexical index in
> Python keeps the retrieval mechanics visible and the fusion step explicit. The
> production scaling path — pushing sparse vectors into Qdrant for server-side hybrid
> search — is noted but intentionally not taken, because the goal here is to *show the
> machinery*, not hide it.

---

## Architecture

```
                    ┌──────────────────────────────────────────────┐
   query  ─────────▶│                SearchService                 │
                    │                                              │
                    │   keyword ──► BM25 (in-memory lexical index) │
                    │   semantic ─► embed query ──► Qdrant kNN      │
                    │   hybrid ───► RRF( keyword , semantic )       │
                    │   rerank ───► cross-encoder( hybrid pool )    │
                    └───────────────┬──────────────────────────────┘
                                    │  top-k SearchHits
                                    ▼
   React UI  ◀──  FastAPI  ◀── { success, data, message } envelope
```

Each retriever first pulls a wider `candidate_pool` (default 30); fusion and reranking
operate on that pool before the final `top_k` (default 10) is returned. The wider pool is
what lets a document ranked, say, #18 by BM25 but #2 by the cross-encoder surface to the
top — the behaviour the benchmark measures.

**Tuning knobs** (all in `app/config.py`, override via env): `bm25_k1`, `bm25_b`,
`rrf_k`, `candidate_pool`, `default_top_k`, model names, Qdrant URL/key.

---

## Tech stack

**Backend** — Python 3.12 · FastAPI · Qdrant · fastembed (ONNX) · pydantic v2 · pytest
**Frontend** — React 18 · TypeScript · Vite · Tailwind CSS · Recharts · Axios · React Router
**Infra** — Docker · Docker Compose · nginx (static serve)

> **Why FastAPI + an app factory:** `create_app()` builds the application without binding
> a port, so the test client (and uvicorn) own the transport. Same separation that lets
> you Supertest an Express app without `listen()` — it keeps the app importable and testable.

> **API envelope:** every endpoint returns `{ success, data, message }`. The envelope is a
> generic pydantic model, so the typed payload flows into the OpenAPI schema and the
> frontend TypeScript types stay honest.

---

## Project structure

```
regsearch/
├── backend/
│   ├── app/
│   │   ├── bm25.py            # hand-rolled Okapi BM25
│   │   ├── fusion.py          # hand-rolled Reciprocal Rank Fusion
│   │   ├── metrics.py         # hand-rolled IR metrics (P@k, R@k, MRR, nDCG@k)
│   │   ├── embeddings.py      # fastembed bi-encoder (lazy-loaded)
│   │   ├── reranker.py        # fastembed cross-encoder (lazy-loaded)
│   │   ├── vectordb.py        # Qdrant client wrapper
│   │   ├── corpus.py          # in-memory corpus + BM25 index
│   │   ├── search.py          # the 4-mode orchestrator
│   │   ├── benchmark.py       # qrels evaluation across all modes
│   │   ├── ingest.py          # embed + upsert into Qdrant
│   │   ├── config.py          # pydantic-settings (all tunables)
│   │   ├── models.py          # request/response schemas + envelope
│   │   └── routes/            # search + benchmark routers
│   ├── data/
│   │   ├── corpus.jsonl       # 40 original GMP/regulatory documents
│   │   └── qrels.json         # 18 judged queries (the golden set)
│   ├── scripts/seed.py        # one-shot dense-index seeder
│   ├── tests/                 # 19 unit tests for the hand-rolled logic
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.ts      # typed axios client (unwraps the envelope)
│   │   ├── components/        # SearchBar, ModeSelector, ResultCard, SignalBar, …
│   │   ├── pages/             # Search · Compare · Benchmark
│   │   └── types/             # TS mirror of the backend schemas
│   └── Dockerfile             # multi-stage build → nginx
└── docker-compose.yml         # Qdrant + backend + frontend
```

---

## Running it

### Option A — Docker Compose (everything at once)

```bash
docker compose up --build
# then seed the dense index once (downloads the model on first run):
docker compose exec backend python -m scripts.seed
```

- Frontend → http://localhost:5173
- API docs → http://localhost:8000/docs
- Qdrant   → http://localhost:6333/dashboard

### Option B — Local dev

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# start Qdrant (Docker is easiest):
docker run -p 6333:6333 qdrant/qdrant
python -m scripts.seed          # build the dense index
uvicorn app.main:app --reload   # http://localhost:8000
```

**Frontend**

```bash
cd frontend
cp .env.example .env            # VITE_API_URL defaults to http://localhost:8000
npm install
npm run dev                     # http://localhost:5173
```

> **Keyword search works immediately** once the corpus loads. **Semantic / hybrid /
> benchmark** need Qdrant seeded — that's what `scripts/seed.py` does. The header status
> readout tells you whether the vector index is populated.

---

## The benchmark

`GET /api/benchmark?k=10` runs every mode against the 18 judged queries in `qrels.json`
and macro-averages four metrics:

- **Precision@k** — of the top-k returned, what fraction are relevant.
- **Recall@k** — of all relevant docs, what fraction appear in the top-k.
- **MRR** — mean reciprocal rank of the *first* relevant hit (how high is the first good result).
- **nDCG@k** — rank-weighted relevance vs. the ideal ordering (rewards putting the best docs first).

The Benchmark page renders this as a grouped bar chart plus a numeric table, and
headlines the nDCG lift of the best mode over the keyword baseline. Because the golden
set is written with vocabulary mismatch in mind, you should expect semantic/hybrid to
beat keyword on the recall-sensitive metrics.

> **Why a hand-built qrels set:** real IR evaluation needs *judged* relevance, not vibes.
> 18 queries with curated relevant-doc lists is small but honest, and it makes the
> "semantic beats keyword *here's the number*" claim concrete instead of hand-wavy.

---

## Deployment notes

The standard split: **frontend on Vercel**, **backend on a container host**
(Render / Fly / Railway), **Qdrant Cloud** (free tier) for the vector store.

1. **Qdrant Cloud** — create a free cluster; set `QDRANT_URL` and `QDRANT_API_KEY` on the backend.
2. **Backend** — deploy the `backend/` Dockerfile. After it's up, run the seed once
   (`python -m scripts.seed`) against the cloud Qdrant. Set `CLIENT_URL` to your Vercel URL for CORS.
3. **Frontend** — deploy `frontend/` to Vercel; set `VITE_API_URL` to the backend's public URL.
4. **Close the loop** — make sure the backend's `CLIENT_URL` matches the deployed frontend origin.

> **Free-tier caveat (read before deploying):** the embedding + reranker models download
> (~130 MB) on first request and need to be held in memory. On the smallest free instances
> this can blow the RAM ceiling or cause a long cold start. Mitigations: use the Docker path
> with the `fastembed_cache` volume so the model persists across restarts; warm the model on
> boot rather than first request; or pick an instance with ≥512 MB–1 GB RAM. The hand-rolled
> **keyword** path has none of these constraints and works on the smallest tier.

---

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest          # 19 tests
```

The suite covers the **hand-rolled logic** — BM25 scoring/ranking, RRF fusion behaviour,
and every IR metric (including edge cases like empty results and the way a larger `k`
compresses rank advantage in RRF). The ONNX inference and Qdrant I/O are integration paths
exercised at runtime rather than unit-tested, since they require model downloads and a live
vector store.

---

## Interview talking points

- **"Walk me through hybrid search."** Two retrievers with different failure modes; RRF
  fuses their *ranks* (not scores, so incomparable scales don't matter); a cross-encoder
  then reads query+doc together to sharpen the top. I can point at `search.py`, `fusion.py`,
  and the benchmark delta to back each claim.
- **"How do you know it's better?"** A judged qrels set and four standard IR metrics, all
  implemented from scratch — so I can explain exactly what nDCG is rewarding, not just cite it.
- **"Why not just use a framework?"** I used a library (`fastembed`) for the heavy ONNX
  inference, but kept BM25, fusion, and metrics hand-rolled because those are the *mechanics*
  an interviewer wants to see me reason about. ONNX over torch also kept the image lean.
- **Bi-encoder vs cross-encoder** — a real, frequently-asked distinction this project
  demonstrates end to end: fast approximate retrieval first, expensive precise reranking
  only on the shortlist.
- **Domain fit** — the corpus is GMP/regulatory (data integrity, validation, CAPA, aseptic
  processing), which ties the retrieval work to 8+ years of pharma compliance experience.

---

*Part of a 12-project full-stack portfolio. Built to be deployed, measured, and explained.*
