"""A hand-rolled Okapi BM25 lexical index.

This is deliberately not a library call. BM25 is the lexical baseline every
hybrid retriever is measured against, and being able to explain its three moving
parts -- term-frequency saturation (k1), length normalisation (b), and IDF --
is worth more in an interview than importing rank_bm25.

Scoring (per query term t, per document d):

    score(d, t) = IDF(t) * ( f(t,d) * (k1 + 1) )
                           / ( f(t,d) + k1 * (1 - b + b * |d| / avgdl) )

    IDF(t) = ln( 1 + (N - n(t) + 0.5) / (n(t) + 0.5) )

where f(t,d) is the term frequency, |d| the document length in tokens, avgdl
the average document length, N the corpus size, and n(t) the number of
documents containing t. The +0.5 smoothing on IDF keeps it strictly positive,
which avoids the negative-score quirk of the textbook formula on common terms.

The index is in-memory. For ~10^2-10^4 short documents that is instant; at
larger scale the production move is to push these as sparse vectors into Qdrant
so lexical and dense retrieval share one store (noted in the README).
"""
from __future__ import annotations

import math
import re
from collections import Counter

# A small, transparent stopword list. Kept short on purpose: aggressive
# stopword removal hurts recall on domain phrases ("out of specification").
_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "how", "i", "in", "is", "it", "its", "of", "on", "or", "that", "the",
    "to", "was", "what", "when", "which", "with", "you", "your",
}

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> list[str]:
    """Lowercase, split on non-alphanumerics, drop stopwords.

    No stemming: keeping tokens literal makes match highlighting honest and the
    behaviour easy to reason about.
    """
    return [t for t in _TOKEN_RE.findall(text.lower()) if t not in _STOPWORDS]


class BM25Index:
    def __init__(self, k1: float = 1.5, b: float = 0.75) -> None:
        self.k1 = k1
        self.b = b
        self.doc_ids: list[str] = []
        self.doc_tokens: dict[str, list[str]] = {}
        self.doc_len: dict[str, int] = {}
        self.term_freqs: dict[str, Counter[str]] = {}  # doc_id -> {term: count}
        self.doc_freq: Counter[str] = Counter()  # term -> #docs containing it
        self.avgdl: float = 0.0
        self.n_docs: int = 0

    def add(self, doc_id: str, text: str) -> None:
        tokens = tokenize(text)
        self.doc_ids.append(doc_id)
        self.doc_tokens[doc_id] = tokens
        self.doc_len[doc_id] = len(tokens)
        tf = Counter(tokens)
        self.term_freqs[doc_id] = tf
        for term in tf:
            self.doc_freq[term] += 1

    def finalize(self) -> None:
        """Compute corpus-level stats once all documents are added."""
        self.n_docs = len(self.doc_ids)
        total_len = sum(self.doc_len.values())
        self.avgdl = (total_len / self.n_docs) if self.n_docs else 0.0

    def _idf(self, term: str) -> float:
        n_t = self.doc_freq.get(term, 0)
        # Strictly-positive smoothed IDF (BM25+ variant).
        return math.log(1 + (self.n_docs - n_t + 0.5) / (n_t + 0.5))

    def search(self, query: str, top_k: int) -> list[tuple[str, float]]:
        """Return [(doc_id, score)] sorted by descending BM25 score."""
        q_terms = tokenize(query)
        if not q_terms or self.n_docs == 0:
            return []

        scores: dict[str, float] = {}
        for term in set(q_terms):
            idf = self._idf(term)
            if idf <= 0:
                continue
            for doc_id in self.doc_ids:
                f = self.term_freqs[doc_id].get(term, 0)
                if f == 0:
                    continue
                dl = self.doc_len[doc_id]
                denom = f + self.k1 * (1 - self.b + self.b * dl / self.avgdl)
                scores[doc_id] = scores.get(doc_id, 0.0) + idf * (f * (self.k1 + 1)) / denom

        ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
        return ranked[:top_k]

    def matched_terms(self, query: str, doc_id: str) -> list[str]:
        """Which (deduplicated) query terms actually appear in the document."""
        q_terms = dict.fromkeys(tokenize(query))  # preserve order, dedupe
        present = self.term_freqs.get(doc_id, Counter())
        return [t for t in q_terms if present.get(t, 0) > 0]
