import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Star, X } from "lucide-react";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import { TemplatePreview } from "@/components/TemplatePreview";

export function TemplatesSection() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewTemplate = TEMPLATE_CATALOG.find((t) => t.id === previewId) || null;

  return (
    <section id="templates" className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-warm/10 text-warm border border-warm/20 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase">
            <FileText className="h-3.5 w-3.5" />
            Professional Templates
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Templates designed to get noticed
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Every template is ATS-optimized, recruiter-approved, and fully customizable.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {TEMPLATE_CATALOG.map((template) => (
            <div key={template.id} className="group">
              <div className="relative rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border aspect-[8.5/11] mb-2">
                <TemplatePreview templateId={template.id} colors={template.colors} />
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                  {template.isPopular && (
                    <span className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center">
                      <Star className="h-2.5 w-2.5 mr-0.5 fill-current" /> Popular
                    </span>
                  )}
                  {!template.isPremium ? (
                    <span className="bg-success text-success-foreground text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Free</span>
                  ) : (
                    <span className="bg-brand text-brand-foreground text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Pro</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <Link
                    to="/login"
                    className="bg-card text-foreground px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-card/90 transition"
                  >
                    Use Template
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold text-foreground text-xs">{template.name}</p>
                  <p className="text-[10px] text-muted-foreground">{template.categoryLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewId(template.id)}
                  className="text-[10px] text-brand hover:underline font-medium"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <div
            className="fixed inset-0 z-[70] bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewId(null)}
          >
            <div
              className="relative w-full max-w-3xl rounded-2xl bg-card shadow-card-hover border border-border p-5 md:p-7 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5">
                <h3 className="font-display text-xl font-bold text-foreground">{previewTemplate.name}</h3>
                <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
              </div>

              <div className="grid md:grid-cols-[1.25fr_0.75fr] gap-5 items-start">
                <div className="rounded-xl border border-border overflow-hidden aspect-[8.5/11] bg-card">
                  <TemplatePreview templateId={previewTemplate.id} colors={previewTemplate.colors} compact={false} />
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Category: <span className="font-semibold text-foreground">{previewTemplate.categoryLabel}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Access:{" "}
                    <span className={`font-semibold ${previewTemplate.isPremium ? "text-brand" : "text-success"}`}>
                      {previewTemplate.isPremium ? "Pro" : "Free"}
                    </span>
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-warm px-4 py-2.5 text-warm-foreground font-semibold text-sm hover:opacity-90 transition shadow-warm"
                  >
                    Use This Template
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
