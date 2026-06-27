import { useState } from "react";
import { analyzeResumes, type AnalyzeResponse } from "./api";
import JobDescriptionInput from "./components/JobDescriptionInput";
import ResumeDropzone from "./components/ResumeDropzone";
import ResultsPanel from "./components/ResultsPanel";

export default function App() {
  const [jd, setJd] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRun = jd.trim().length > 0 && files.length > 0 && !loading;

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await analyzeResumes(jd, files);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full backdrop-grid">
      <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-ink flex items-center justify-center">
              <span className="font-display font-bold text-white text-sm">R</span>
            </div>
            <span className="font-display font-semibold text-ink">
              Resume Analyzer
            </span>
          </div>
          <span className="text-xs text-slatey hidden sm:block">
            Keyword + fuzzy matching · weighted scoring
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 max-w-2xl">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight">
            Rank candidates against any job in seconds.
          </h1>
          <p className="text-slatey mt-3 leading-relaxed">
            Paste a job description, drop in resumes, and get a transparent,
            weighted match score for each candidate — with the exact skills they
            hit and miss.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6">
          {/* Inputs */}
          <section className="space-y-5">
            <JobDescriptionInput value={jd} onChange={setJd} />
            <ResumeDropzone files={files} onChange={setFiles} />
            <button
              onClick={run}
              disabled={!canRun}
              className="w-full rounded-xl bg-indigo px-4 py-3 font-display font-semibold text-white shadow-card transition-opacity disabled:opacity-40 hover:bg-indigo/90"
            >
              {loading ? "Analyzing…" : "Rank candidates"}
            </button>
            <p className="text-xs text-slatey text-center">
              Nothing is stored — files are scored in memory and discarded.
            </p>
          </section>

          {/* Results */}
          <section className="lg:min-h-[400px]">
            <ResultsPanel data={data} loading={loading} error={error} />
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-slatey">
        Built with React, TypeScript & FastAPI.
      </footer>
    </div>
  );
}
