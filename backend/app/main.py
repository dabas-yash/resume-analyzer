"""
main.py
-------
The FastAPI application. One main endpoint:

  POST /api/analyze
       form fields:
         - job_description: str   (the JD text)
         - files: list[UploadFile] (one or more resumes: pdf/docx/txt)
       returns: the extracted JD keywords + ranked resume results

Run locally:  uvicorn app.main:app --reload --port 5000
Docs:         http://localhost:5000/docs
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .matching import ResumeMatcher
from .parsing import extract_text
from .schemas import (
    AnalyzeResponse, ResumeResultOut, KeywordOut, KeywordMatchOut,
)

app = FastAPI(title="Resume Analyzer API", version="1.0.0")

# Allow the React dev server (and later, the deployed frontend) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

matcher = ResumeMatcher()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(
    job_description: str = Form(...),
    files: list[UploadFile] = File(...),
):
    if not job_description.strip():
        raise HTTPException(400, "Job description is empty.")
    if not files:
        raise HTTPException(400, "Upload at least one resume.")

    # 1. Extract text from every uploaded resume.
    resumes: list[tuple[str, str]] = []
    for f in files:
        raw = await f.read()
        try:
            text = extract_text(f.filename, raw)
        except ValueError as e:
            raise HTTPException(400, str(e))
        if text.strip():
            resumes.append((f.filename, text))

    if not resumes:
        raise HTTPException(400, "Could not extract text from the uploaded files.")

    # 2. Analyze + rank.
    keywords = matcher.analyze_job_description(job_description)
    results = matcher.rank_resumes(job_description, resumes)

    # 3. Shape the response.
    def to_match_out(m):
        return KeywordMatchOut(
            term=m.term, weight=m.weight, quality=m.quality,
            status=m.status, evidence=m.evidence,
        )

    results_out = []
    for rank, r in enumerate(results, start=1):
        results_out.append(ResumeResultOut(
            name=r.name,
            score=r.score,
            rank=rank,
            matched=[m.term for m in r.matched],
            partial=[to_match_out(m) for m in r.partial],
            missing=[m.term for m in r.missing],
            matches=[to_match_out(m) for m in r.matches],
        ))

    return AnalyzeResponse(
        keywords=[
            KeywordOut(term=k.term, weight=k.weight, is_skill=k.is_skill)
            for k in keywords
        ],
        results=results_out,
    )
