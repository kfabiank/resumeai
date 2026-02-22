"use client";

import { useRef, useState } from "react";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import type { ResumeData } from "@/types/resume";

type ResumeApiResponse = {
  id: string;
  title: string;
  templateId: string;
  content: any;
};

type Props = {
  resumeId: string;
  fallbackName: string;
  className?: string;
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

export default function StyledPdfDownloadButton({ resumeId, fallbackName, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [renderState, setRenderState] = useState<{
    title: string;
    templateId: string;
    data: ResumeData;
  } | null>(null);
  const exportPreviewRef = useRef<HTMLDivElement | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      const resumeRes = await fetch(`/api/resume/${resumeId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!resumeRes.ok) throw new Error("Failed to load resume for template PDF export.");

      const resume = (await resumeRes.json()) as ResumeApiResponse;
      const renderData = {
        title: resume.title || fallbackName,
        templateId: resume.templateId || "modern-professional",
        data: mapToResumeData(resume.content || {}),
      };
      setRenderState(renderData);

      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      if ("fonts" in document) {
        await document.fonts.ready;
      }

      const exportNode = exportPreviewRef.current;
      if (!exportNode) throw new Error("Template preview not ready.");

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

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(clonedNode, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: clonedNode.scrollWidth,
          windowHeight: clonedNode.scrollHeight,
          foreignObjectRendering: true,
        });
      } catch {
        canvas = await html2canvas(clonedNode, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: clonedNode.scrollWidth,
          windowHeight: clonedNode.scrollHeight,
          foreignObjectRendering: false,
        });
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

        if (pageIndex > 0) pdf.addPage();
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
    } catch (error) {
      console.error(error);
      alert("Failed to download template-designed PDF.");
    } finally {
      setRenderState(null);
      setBusy(false);
    }
  };

  return (
    <>
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
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        {renderState ? (
          <div
            ref={exportPreviewRef}
            data-template-id={renderState.templateId}
            className="w-[794px] min-h-[1123px] overflow-hidden bg-white"
          >
            <TemplateRenderer templateId={renderState.templateId} data={renderState.data} />
          </div>
        ) : null}
      </div>
    </>
  );
}
