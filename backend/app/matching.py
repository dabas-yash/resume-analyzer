"""
matching.py
-----------
The core engine. Three stages:

  1. analyze_job_description(jd)  -> weighted keywords the JD cares about
  2. score_resume(resume, kws)   -> match %, plus matched / partial / missing
  3. rank_resumes(...)           -> sort candidates best-first

Matching uses two signals:
  - EXACT  : the skill (or one of its aliases) literally appears  -> credit 1.0
  - FUZZY  : a close variant appears (rapidfuzz similarity)        -> partial credit

Scoring is a WEIGHTED percentage:
        score = sum(weight_i * match_quality_i) / sum(weight_i) * 100
so missing an important (heavily weighted) skill hurts more than missing a
minor one. That weighting is the difference between this and a naive
"how many keywords overlap" counter.
"""

import re
from dataclasses import dataclass, field
from collections import Counter

from rapidfuzz import fuzz, process

from .taxonomy import SkillTaxonomy

# Similarity at/above this counts as a fuzzy hit. 100 = identical.
FUZZY_THRESHOLD = 85

# Generic words that show up in every JD and carry no signal.
STOPWORDS = {
    "the", "and", "for", "with", "you", "your", "our", "are", "will", "have",
    "this", "that", "from", "they", "their", "them", "all", "any", "can",
    "who", "what", "when", "how", "but", "not", "out", "use", "using", "able",
    "experience", "years", "year", "team", "teams", "work", "working", "role",
    "ability", "strong", "good", "great", "excellent", "knowledge", "skills",
    "skill", "looking", "join", "help", "build", "building", "across", "within",
    "including", "etc", "such", "well", "must", "should", "candidate", "ideal",
    "responsibilities", "requirements", "qualifications", "preferred", "plus",
}


@dataclass
class WeightedKeyword:
    term: str                # canonical skill name or raw keyword
    weight: float            # importance, derived from JD frequency
    is_skill: bool           # True if it came from the taxonomy
    aliases: list[str] = field(default_factory=list)


@dataclass
class KeywordMatch:
    term: str
    weight: float
    quality: float           # 1.0 exact, 0.0-1.0 fuzzy, 0.0 missing
    status: str              # "matched" | "partial" | "missing"
    evidence: str = ""       # what in the resume triggered the match


@dataclass
class ResumeResult:
    name: str
    score: float
    matches: list[KeywordMatch]

    @property
    def matched(self):  return [m for m in self.matches if m.status == "matched"]
    @property
    def partial(self):  return [m for m in self.matches if m.status == "partial"]
    @property
    def missing(self):  return [m for m in self.matches if m.status == "missing"]


class ResumeMatcher:
    def __init__(self, taxonomy: SkillTaxonomy | None = None):
        self.tax = taxonomy or SkillTaxonomy()

    # ----- stage 1: understand the job description -------------------------
    def analyze_job_description(self, jd_text: str) -> list[WeightedKeyword]:
        keywords: dict[str, WeightedKeyword] = {}

        # (a) Known skills from the taxonomy (high precision, alias-aware).
        skills = self.tax.detect_skills(jd_text)
        jd_lower = jd_text.lower()
        for skill in skills:
            # Weight by how often any alias of the skill appears in the JD,
            # so repeatedly-mentioned skills count for more. Clamped 1..3.
            freq = sum(
                len(re.findall(r"(?<![a-z0-9+#.])" + re.escape(a) + r"(?![a-z0-9+#])", jd_lower))
                for a in self.tax.aliases_for(skill)
            )
            keywords[skill] = WeightedKeyword(
                term=skill,
                weight=min(1.0 + 0.5 * (freq - 1), 3.0),
                is_skill=True,
                aliases=self.tax.aliases_for(skill),
            )

        # (b) Significant non-taxonomy terms, so nothing important is dropped.
        # Keep words that repeat (freq >= 2), aren't stopwords, len >= 3,
        # and aren't already covered by a taxonomy alias.
        covered = {a for kw in keywords.values() for a in kw.aliases}
        tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+.#-]{2,}", jd_lower)
        freqs = Counter(t for t in tokens if t not in STOPWORDS and t not in covered)
        for term, freq in freqs.items():
            if freq >= 2 and term not in keywords:
                keywords[term] = WeightedKeyword(
                    term=term,
                    weight=min(1.0 + 0.25 * (freq - 1), 2.0),
                    is_skill=False,
                    aliases=[term],
                )

        return list(keywords.values())

    # ----- stage 2: score one resume against those keywords ----------------
    def score_resume(self, name: str, resume_text: str,
                     keywords: list[WeightedKeyword]) -> ResumeResult:
        resume_lower = resume_text.lower()
        resume_skills = self.tax.detect_skills(resume_text)
        # Build candidate phrases (unigrams + bigrams) for fuzzy comparison.
        candidates = self._candidate_phrases(resume_lower)

        matches: list[KeywordMatch] = []
        for kw in keywords:
            quality, status, evidence = self._match_keyword(
                kw, resume_lower, resume_skills, candidates
            )
            matches.append(KeywordMatch(
                term=kw.term, weight=kw.weight,
                quality=quality, status=status, evidence=evidence,
            ))

        total_weight = sum(kw.weight for kw in keywords) or 1.0
        earned = sum(m.weight * m.quality for m in matches)
        score = round(earned / total_weight * 100, 1)
        return ResumeResult(name=name, score=score, matches=matches)

    def _match_keyword(self, kw, resume_lower, resume_skills, candidates):
        # 1) Exact: taxonomy skill present, or raw term appears verbatim.
        if kw.is_skill and kw.term in resume_skills:
            return 1.0, "matched", kw.term
        if not kw.is_skill:
            pattern = r"(?<![a-z0-9+#.])" + re.escape(kw.term) + r"(?![a-z0-9+#])"
            if re.search(pattern, resume_lower):
                return 1.0, "matched", kw.term

        # 2) Fuzzy: closest candidate phrase in the resume.
        best = process.extractOne(kw.term, candidates, scorer=fuzz.ratio)
        if best and best[1] >= FUZZY_THRESHOLD:
            return round(best[1] / 100, 2), "partial", best[0]

        return 0.0, "missing", ""

    @staticmethod
    def _candidate_phrases(text_lower: str) -> list[str]:
        words = re.findall(r"[a-zA-Z][a-zA-Z0-9+.#-]{1,}", text_lower)
        phrases = set(words)
        for i in range(len(words) - 1):
            phrases.add(f"{words[i]} {words[i+1]}")
        return list(phrases)

    # ----- stage 3: rank a batch of resumes --------------------------------
    def rank_resumes(self, jd_text: str,
                     resumes: list[tuple[str, str]]) -> list[ResumeResult]:
        keywords = self.analyze_job_description(jd_text)
        results = [self.score_resume(n, t, keywords) for n, t in resumes]
        results.sort(key=lambda r: r.score, reverse=True)
        return results
