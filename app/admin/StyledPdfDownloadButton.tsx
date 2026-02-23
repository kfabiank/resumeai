"use client";

import { useState } from "react";

type Props = {
  resumeId: string;
  fallbackName: string;
  className?: string;
};

export default function StyledPdfDownloadButton({ resumeId, fallbackName, className }: Props) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/resume/${resumeId}/export-styled-pdf`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to export styled PDF (${res.status}).`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const headerFileName =
        disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ||
        disposition.match(/filename="([^"]+)"/i)?.[1] ||
        disposition.match(/filename=([^;]+)/i)?.[1] ||
        "";
      const finalFileName = headerFileName
        ? decodeURIComponent(headerFileName).replace(/^["']|["']$/g, "")
        : `${fallbackName || "Resume"}.pdf`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      alert("Failed to download styled PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={
        className ||
        "rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {busy ? "Preparing PDF..." : "Download PDF"}
    </button>
  );
}
