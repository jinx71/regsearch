"""IR metric tests using worked examples that can be checked by hand."""
import math

from app.metrics import ndcg_at_k, precision_at_k, recall_at_k, reciprocal_rank

RANKED = ["a", "b", "c", "d", "e"]
RELEVANT = {"a", "c", "e"}


def test_precision_at_k():
    # top-3 = a,b,c -> 2 relevant of 3.
    assert precision_at_k(RANKED, RELEVANT, 3) == 2 / 3


def test_recall_at_k():
    # top-3 contains a,c (2 of the 3 relevant docs).
    assert recall_at_k(RANKED, RELEVANT, 3) == 2 / 3


def test_recall_full_list_is_one():
    assert recall_at_k(RANKED, RELEVANT, 5) == 1.0


def test_reciprocal_rank_first_relevant_at_one():
    assert reciprocal_rank(RANKED, RELEVANT) == 1.0


def test_reciprocal_rank_first_relevant_at_two():
    assert reciprocal_rank(["x", "a", "b"], {"a"}) == 0.5


def test_reciprocal_rank_none_relevant():
    assert reciprocal_rank(["x", "y"], {"a"}) == 0.0


def test_ndcg_perfect_order_is_one():
    ranked = ["a", "c", "e", "b", "d"]  # all relevant packed at the top
    assert ndcg_at_k(ranked, RELEVANT, 5) == 1.0


def test_ndcg_known_value():
    # Relevant at ranks 1 and 3 only.
    ranked = ["a", "x", "c", "y"]
    relevant = {"a", "c"}
    dcg = 1 / math.log2(2) + 1 / math.log2(4)  # ranks 1 and 3
    idcg = 1 / math.log2(2) + 1 / math.log2(3)  # ideal: ranks 1 and 2
    assert math.isclose(ndcg_at_k(ranked, relevant, 4), dcg / idcg, rel_tol=1e-9)


def test_empty_relevant_set_is_zero_recall():
    assert recall_at_k(RANKED, set(), 3) == 0.0
