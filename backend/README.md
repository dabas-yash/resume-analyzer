# Resume Analyzer — Backend (FastAPI)

Screens resumes against a job description using keyword + fuzzy matching and a
weighted scoring algorithm, then ranks candidates by match percentage.

## Architecture

```
app/
├── data/skills.json   # skill taxonomy: canonical skill -> aliases
├── taxonomy.py        # loads taxonomy, detects/normalizes skills in text
├── parsing.py         # extracts text from PDF / DOCX / TXT resumes
├── matching.py        # CORE engine: JD analysis, scoring, ranking
├── schemas.py         # Pydantic response models
└── main.py            # FastAPI app + /api/analyze endpoint
```

### How scoring works
1. **Analyze the JD** → a set of weighted keywords. Known skills come from the
   taxonomy (alias-aware: "JS" = "JavaScript"); their weight rises with how
   often they appear in the JD. Significant repeated non-taxonomy terms are
   included too.
2. **Score each resume** → for every JD keyword, look for an exact match
   (credit 1.0) or a close fuzzy match (partial credit via RapidFuzz).
3. **Final score** = `sum(weight × match_quality) / sum(weight) × 100`.
   Missing a heavily-weighted skill costs more than missing a minor one.
4. **Rank** candidates best-first.

## Run locally

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

- API:  http://localhost:5000
- Interactive docs: http://localhost:5000/docs

## Endpoints
| Method | Path           | Description                              |
|--------|----------------|------------------------------------------|
| GET    | `/api/health`  | health check                             |
| POST   | `/api/analyze` | form: `job_description` + `files[]` → ranked results |

## Extending it
- Add skills/aliases in `app/data/skills.json` — no code change needed.
- Tune `FUZZY_THRESHOLD` in `matching.py` (higher = stricter).
- Swap in semantic matching (embeddings/TF-IDF) inside `_match_keyword` later.
