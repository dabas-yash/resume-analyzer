"""
schemas.py
----------
Pydantic models define the JSON shape the API returns. FastAPI uses these
for validation AND auto-generated docs at /docs.
"""

from pydantic import BaseModel


class KeywordMatchOut(BaseModel):
    term: str
    weight: float
    quality: float
    status: str          # matched | partial | missing
    evidence: str


class ResumeResultOut(BaseModel):
    name: str
    score: float
    rank: int
    matched: list[str]
    partial: list[KeywordMatchOut]
    missing: list[str]
    matches: list[KeywordMatchOut]


class KeywordOut(BaseModel):
    term: str
    weight: float
    is_skill: bool


class AnalyzeResponse(BaseModel):
    keywords: list[KeywordOut]
    results: list[ResumeResultOut]
