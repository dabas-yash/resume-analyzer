// api.ts — types mirror the backend's Pydantic schemas, plus the fetch call.

// In dev this falls back to localhost; in production set VITE_API_URL.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface KeywordMatch {
  term: string;
  weight: number;
  quality: number;
  status: "matched" | "partial" | "missing";
  evidence: string;
}

export interface ResumeResult {
  name: string;
  score: number;
  rank: number;
  matched: string[];
  partial: KeywordMatch[];
  missing: string[];
  matches: KeywordMatch[];
}

export interface Keyword {
  term: string;
  weight: number;
  is_skill: boolean;
}

export interface AnalyzeResponse {
  keywords: Keyword[];
  results: ResumeResult[];
}

export async function analyzeResumes(
  jobDescription: string,
  files: File[]
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("job_description", jobDescription);
  files.forEach((f) => form.append("files", f));

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}
