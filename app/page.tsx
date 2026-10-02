"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DESTINATIONS } from "@/lib/destinations";
import { LANG_LABELS, LANGS, STRINGS, type Lang } from "@/lib/i18n";

const langListeners = new Set<() => void>();

function subscribeLang(fn: () => void) {
  langListeners.add(fn);
  return () => {
    langListeners.delete(fn);
  };
}

function getLang(): Lang {
  const saved = localStorage.getItem("lang");
  return saved === "hu" ? "hu" : "ro";
}

interface FileResult {
  name: string;
  rows: number;
  warnings: string[];
  error?: string;
}

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Home() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [destination, setDestination] = useState<string>(DESTINATIONS[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [results, setResults] = useState<FileResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const lang = useSyncExternalStore(subscribeLang, getLang, () => "ro" as Lang);
  const t = STRINGS[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function changeLang(l: Lang) {
    localStorage.setItem("lang", l);
    langListeners.forEach((fn) => fn());
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const pdfs = Array.from(list).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    setFiles((prev) => [...prev, ...pdfs.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))]);
    setResults([]);
    setDone("");
    setError("");
  }

  function reset() {
    setFiles([]);
    setResults([]);
    setDone("");
    setError("");
  }

  async function generate() {
    setBusy(true);
    setError("");
    setDone("");
    setResults([]);
    try {
      const form = new FormData();
      form.append("date", date);
      form.append("destination", destination);
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/report", { method: "POST", body: form });
      const json = await res.json();
      setResults(json.results ?? []);
      if (!res.ok) {
        setError(json.error ?? t.failed);
        return;
      }
      const bytes = Uint8Array.from(atob(json.file), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(
        new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = json.filename;
      a.click();
      URL.revokeObjectURL(url);
      const total = (json.results as FileResult[]).reduce((n, r) => n + r.rows, 0);
      setDone(t.downloaded(json.filename, total));
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-white text-sm">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => changeLang(l)}
              aria-pressed={lang === l}
              className={`px-3 py-1.5 font-medium ${lang === l ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {t.date}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium">
            {t.destination}
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass}>
              {DESTINATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
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
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
          }`}
        >
          <p className="font-medium">{t.dropTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{t.dropHint}</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{t.files(files.length)}</span>
              <button onClick={reset} disabled={busy} className="text-slate-500 hover:text-red-600 disabled:opacity-50">
                {t.clearAll}
              </button>
            </div>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {files.map((f, i) => {
                const r = results.find((x) => x.name === f.name);
                return (
                  <li key={`${f.name}-${i}`} className="flex items-start justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{f.name}</div>
                      <div className="text-xs text-slate-500">{formatSize(f.size)}</div>
                      {r?.error && <div className="mt-1 text-red-600">{r.error}</div>}
                      {r && !r.error && <div className="mt-1 text-green-700">{t.rowsExtracted(r.rows)}</div>}
                      {r?.warnings.map((w, j) => (
                        <div key={j} className="mt-1 text-amber-600">
                          {w}
                        </div>
                      ))}
                    </div>
                    <button
                      aria-label={t.remove(f.name)}
                      disabled={busy}
                      onClick={() => setFiles(files.filter((_, k) => k !== i))}
                      className="shrink-0 rounded px-2 text-lg leading-none text-slate-400 hover:text-red-600 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {done && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{done}</p>}

        <button
          disabled={busy || files.length === 0 || !date}
          onClick={generate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {busy ? t.generating : t.generate}
        </button>
      </div>
    </main>
  );
}
