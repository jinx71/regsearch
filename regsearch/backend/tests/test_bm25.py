"""BM25 behaviour tests.

These pin the properties that make BM25 BM25, so a future refactor can't quietly
break the ranking: term-frequency saturation, length normalisation, IDF
weighting of rare terms, and correct match reporting.
"""
from app.bm25 import BM25Index, tokenize


def build(docs: dict[str, str], k1: float = 1.5, b: float = 0.75) -> BM25Index:
    idx = BM25Index(k1=k1, b=b)
    for doc_id, text in docs.items():
        idx.add(doc_id, text)
    idx.finalize()
    return idx


def test_tokenize_lowercases_and_drops_stopwords():
    assert tokenize("The Quick Brown FOX") == ["quick", "brown", "fox"]


def test_exact_term_match_ranks_first():
    idx = build({
        "d1": "calibration of pressure instruments",
        "d2": "cleaning validation of equipment",
        "d3": "stability testing of products",
    })
    results = idx.search("calibration", top_k=3)
    assert results[0][0] == "d1"


def test_rare_term_outweighs_common_term():
    # "validation" appears in 3/3 docs (low IDF); "endotoxin" in 1/3 (high IDF).
    idx = build({
        "d1": "validation validation validation",
        "d2": "validation endotoxin",
        "d3": "validation report",
    })
    results = dict(idx.search("validation endotoxin", top_k=3))
    # The doc carrying the rare, discriminating term should win despite d1
    # repeating the common term many times.
    assert max(results, key=results.get) == "d2"


def test_length_normalisation_penalises_padding():
    # Same single relevant term; d_long is padded with unrelated tokens.
    idx = build({
        "short": "deviation",
        "long": "deviation " + "unrelated " * 50,
    })
    scores = dict(idx.search("deviation", top_k=2))
    assert scores["short"] > scores["long"]


def test_no_match_returns_empty():
    idx = build({"d1": "purified water system"})
    assert idx.search("xenon laser", top_k=5) == []


def test_matched_terms_reports_only_present_query_terms():
    idx = build({"d1": "aseptic filling under controlled airflow"})
    matched = idx.matched_terms("aseptic gowning airflow", "d1")
    assert matched == ["aseptic", "airflow"]
