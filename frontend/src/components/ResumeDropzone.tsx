// ResumeDropzone.tsx — drag-and-drop (and click) upload for resume files.

import { useRef, useState } from "react";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
}

const ACCEPT = ".pdf,.docx,.txt";

export default function ResumeDropzone({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next = [...files];
    Array.from(incoming).forEach((f) => {
      if (!next.some((e) => e.name === f.name && e.size === f.size)) next.push(f);
    });
    onChange(next);
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-display font-semibold text-sm text-ink">
          Resumes
        </label>
        <span className="text-xs text-slatey">
          {files.length} file{files.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
          dragging
            ? "border-indigo bg-indigo-soft"
            : "border-line bg-surface hover:border-indigo/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <p className="text-sm text-ink font-medium">
          Drop resumes here, or click to browse
        </p>
        <p className="text-xs text-slatey mt-1">PDF, DOCX, or TXT · multiple allowed</p>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-lg bg-surface border border-line px-3 py-2"
            >
              <span className="text-sm text-ink truncate mr-2">{f.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                className="text-xs text-slatey hover:text-weak"
                aria-label={`Remove ${f.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
