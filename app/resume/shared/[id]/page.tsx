"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import type { ResumeData } from "@/types/resume";

type PublicResume = {
  id: string;
  title: string;
  content: ResumeData;
  templateId: string;
  updatedAt: string;
  viewCount: number;
};

export default function SharedResumePage() {
  const params = useParams();
  const id = params.id as string;
  const [resume, setResume] = useState<PublicResume | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/public/resume/${id}`, { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Resume not found");
        setResume(body);
      } catch (err: any) {
        setError(err.message || "Resume not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) void load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Resume unavailable</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto mb-4 text-sm text-gray-600 flex items-center justify-between">
        <span>Shared Resume: {resume.title}</span>
        <span>{resume.viewCount} views</span>
      </div>
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-lg rounded-xl p-8">
        <TemplateRenderer templateId={resume.templateId} data={resume.content} />
      </div>
    </div>
  );
}
