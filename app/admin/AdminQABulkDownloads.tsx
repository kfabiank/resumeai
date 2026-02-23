"use client";

import { useMemo, useState } from "react";

type QaItem = {
  id: string;
  pngFile: string | null;
  resumeId: string | null;
};

type Props = {
  items: QaItem[];
};

async function downloadBlob(url: string, method: "GET" | "POST", fallbackName: string) {
  const res = await fetch(url, { method, credentials: "include" });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}) for ${fallbackName}`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") || "";
  const headerFileName =
    disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ||
    disposition.match(/filename="([^"]+)"/i)?.[1] ||
    disposition.match(/filename=([^;]+)/i)?.[1] ||
    "";
  const filename = headerFileName
    ? decodeURIComponent(headerFileName).replace(/^["']|["']$/g, "")
    : fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function AdminQABulkDownloads({ items }: Props) {
  const [busy, setBusy] = useState<null | "png" | "pdf" | "docx">(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const pngItems = useMemo(() => items.filter((i) => i.pngFile), [items]);
  const pdfItems = useMemo(() => items.filter((i) => i.resumeId), [items]);

  const run = async (kind: "png" | "pdf" | "docx") => {
    setBusy(kind);
    setError("");
    setDone("");
    try {
      if (kind === "png") {
        for (const item of pngItems) {
          if (!item.pngFile) continue;
          await downloadBlob(item.pngFile, "GET", `${item.id}.png`);
        }
        setDone(`Downloaded ${pngItems.length} PNG files.`);
        return;
      }

      for (const item of pdfItems) {
        if (!item.resumeId) continue;
        if (kind === "pdf") {
          await downloadBlob(
            `/api/resume/${item.resumeId}/export-styled-pdf`,
            "POST",
            `${item.id}.pdf`
          );
          continue;
        }
        await downloadBlob(`/api/resume/${item.resumeId}/export-docx`, "POST", `${item.id}.docx`);
      }
      setDone(`Downloaded ${pdfItems.length} ${kind.toUpperCase()} files.`);
    } catch (e: any) {
      setError(e?.message || "Bulk download failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Download All</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run("png")}
          disabled={busy !== null || pngItems.length === 0}
          className="rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "png" ? "Downloading..." : `All PNG (${pngItems.length})`}
        </button>
        <button
          type="button"
          onClick={() => run("pdf")}
          disabled={busy !== null || pdfItems.length === 0}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "pdf" ? "Downloading..." : `All PDF (${pdfItems.length})`}
        </button>
        <button
          type="button"
          onClick={() => run("docx")}
          disabled={busy !== null || pdfItems.length === 0}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "docx" ? "Downloading..." : `All DOCX (${pdfItems.length})`}
        </button>
      </div>
      {done ? <p className="mt-2 text-xs text-emerald-700">{done}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
