"use client";

import { useMemo, useRef, useState } from "react";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import type { ResumeData } from "@/types/resume";

type QaItem = {
  id: string;
  pngFile: string | null;
  resumeId: string | null;
};

type Props = {
  items: QaItem[];
};

type ResumeApiResponse = {
  id: string;
  title: string;
  templateId: string;
  content: any;
};

type ExportRenderState = {
  title: string;
  templateId: string;
  data: ResumeData;
};

function sanitizeName(value: string) {
  return `${value || "resume"}`.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "resume";
}

function mapToResumeData(content: any): ResumeData {
  const personal = content?.personalInfo || {};
  const experiences = Array.isArray(content?.experiences) ? content.experiences : [];
  const education = Array.isArray(content?.education) ? content.education : [];
  const technical = Array.isArray(content?.skills?.technical) ? content.skills.technical : [];
  const soft = Array.isArray(content?.skills?.soft) ? content.skills.soft : [];
  const keywords = Array.isArray(content?.keywords) ? content.keywords : [];

  return {
    personalInfo: {
      name: personal.name || "John Doe",
      email: personal.email || "john.doe@email.com",
      phone: personal.phone || "+1 555 123 4567",
      location: personal.location || "",
      linkedin: personal.linkedin || "",
      portfolio: personal.portfolio || "",
      headline: personal.headline || "",
    },
    professionalSummary: content?.professionalSummary || "",
    experiences: experiences.map((exp: any) => ({
      title: exp?.title || "",
      company: exp?.company || "",
      location: exp?.location || "",
      startDate: exp?.startDate || "",
      endDate: exp?.endDate || "",
      current: !!exp?.current,
      optimizedBullets: Array.isArray(exp?.optimizedBullets) ? exp.optimizedBullets : [],
      keywordsUsed: Array.isArray(exp?.keywordsUsed) ? exp.keywordsUsed : [],
    })),
    education: education.map((edu: any) => ({
      degree: edu?.degree || "",
      institution: edu?.institution || "",
      location: edu?.location || "",
      graduationDate: edu?.graduationDate || "",
      gpa: edu?.gpa || "",
    })),
    skills: {
      technical,
      soft,
    },
    keywords,
  };
}

async function downloadBlob(url: string, method: "GET" | "POST", filename: string) {
  const res = await fetch(url, { method, credentials: "include" });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}) for ${filename}`);
  }
  const blob = await res.blob();
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
  const [exportRenderState, setExportRenderState] = useState<ExportRenderState | null>(null);
  const exportPreviewRef = useRef<HTMLDivElement | null>(null);

  const pngItems = useMemo(() => items.filter((i) => i.pngFile), [items]);
  const pdfItems = useMemo(() => items.filter((i) => i.resumeId), [items]);

  const downloadStyledPdf = async (resumeId: string, fallbackName: string) => {
    const resumeRes = await fetch(`/api/resume/${resumeId}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!resumeRes.ok) {
      throw new Error(`Could not load resume ${resumeId} for PDF export.`);
    }

    const resume = (await resumeRes.json()) as ResumeApiResponse;
    const renderData: ExportRenderState = {
      title: resume.title || fallbackName,
      templateId: resume.templateId || "modern-professional",
      data: mapToResumeData(resume.content || {}),
    };
    setExportRenderState(renderData);

    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    if ("fonts" in document) {
      await document.fonts.ready;
    }

    const exportNode = exportPreviewRef.current;
    if (!exportNode) {
      throw new Error("Template preview is not ready yet.");
    }

    const sandbox = document.createElement("div");
    sandbox.style.position = "fixed";
    sandbox.style.left = "-10000px";
    sandbox.style.top = "0";
    sandbox.style.zIndex = "-1";
    sandbox.style.background = "#ffffff";
    sandbox.style.width = `${exportNode.scrollWidth}px`;
    sandbox.style.overflow = "hidden";

    const clonedNode = exportNode.cloneNode(true) as HTMLDivElement;
    clonedNode.setAttribute("data-template-id", renderData.templateId);
    clonedNode.style.position = "static";
    clonedNode.style.left = "0";
    clonedNode.style.top = "0";
    clonedNode.style.opacity = "1";
    clonedNode.style.pointerEvents = "none";

    sandbox.appendChild(clonedNode);
    document.body.appendChild(sandbox);

    const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const baseCanvasOptions = {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: clonedNode.scrollWidth,
      windowHeight: clonedNode.scrollHeight,
      onclone: (clonedDoc: Document) => {
        clonedDoc.getSelection()?.removeAllRanges();
        const style = clonedDoc.createElement("style");
        style.textContent = `
          * { animation: none !important; transition: none !important; caret-color: transparent !important; }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          ::selection { background: transparent !important; color: inherit !important; }
        `;
        clonedDoc.head.appendChild(style);
      },
    };

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(clonedNode, { ...baseCanvasOptions, foreignObjectRendering: true });
    } catch {
      canvas = await html2canvas(clonedNode, { ...baseCanvasOptions, foreignObjectRendering: false });
    }
    sandbox.remove();

    const pdf = new JsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pxPerMm = canvas.width / pageWidth;
    const pageHeightPx = Math.floor(pageHeight * pxPerMm);

    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < canvas.height - 1) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext("2d");
      if (!ctx) throw new Error("Failed to render PDF page.");

      ctx.drawImage(
        canvas,
        0,
        renderedHeight,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      if (pageIndex > 0) {
        pdf.addPage();
      }
      const pageData = pageCanvas.toDataURL("image/png");
      const pdfSliceHeight = (sliceHeight * pageWidth) / canvas.width;
      pdf.addImage(pageData, "PNG", 0, 0, pageWidth, pdfSliceHeight);

      renderedHeight += sliceHeight;
      pageIndex += 1;
    }

    const blob = pdf.output("blob");
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${sanitizeName(renderData.title || fallbackName)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  };

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
          await downloadStyledPdf(item.resumeId, item.id);
          continue;
        }
        await downloadBlob(`/api/resume/${item.resumeId}/export-docx`, "POST", `${item.id}.docx`);
      }
      setDone(`Downloaded ${pdfItems.length} ${kind.toUpperCase()} files.`);
    } catch (e: any) {
      setError(e?.message || "Bulk download failed.");
    } finally {
      setExportRenderState(null);
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
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        {exportRenderState ? (
          <div
            ref={exportPreviewRef}
            data-template-id={exportRenderState.templateId}
            className="w-[794px] min-h-[1123px] overflow-hidden bg-white"
          >
            <TemplateRenderer templateId={exportRenderState.templateId} data={exportRenderState.data} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
