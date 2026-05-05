"""RRF tests: the fusion must reward agreement across rankers and stay
scale-free (only ranks matter, never the raw scores)."""
from app.fusion import reciprocal_rank_fusion


def test_consensus_top_wins():
    # 'a' is ranked highly by both lists; it should fuse to the top.
    kw = ["a", "b", "c"]
    sem = ["a", "c", "d"]
    fused = reciprocal_rank_fusion([kw, sem])
    assert fused[0][0] == "a"


def test_doc_in_one_list_still_appears():
    fused = dict(reciprocal_rank_fusion([["a", "b"], ["c"]]))
    assert set(fused) == {"a", "b", "c"}


def test_rank_only_no_score_dependence():
    # Identical rankings -> identical fused order regardless of any external
    # score magnitude (RRF never sees scores).
    a = ["x", "y", "z"]
    fused = [doc for doc, _ in reciprocal_rank_fusion([a, a])]
    assert fused == ["x", "y", "z"]


def test_higher_k_compresses_rank_advantage():
    # One ranker, two docs at consecutive ranks. The score gap between adjacent
    # ranks is 1/((k+1)(k+2)), which shrinks as k grows -- so a larger k damps
    # how much a better rank is worth.
    ranking = [["a", "b"]]
    low_k = dict(reciprocal_rank_fusion(ranking, k=1))
    high_k = dict(reciprocal_rank_fusion(ranking, k=1000))
    gap_low = low_k["a"] - low_k["b"]
    gap_high = high_k["a"] - high_k["b"]
    assert gap_high < gap_low
