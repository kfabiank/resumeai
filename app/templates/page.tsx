"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Check, Lock, Eye, Star } from "lucide-react";
import {
  isTemplateId,
  TEMPLATE_CATALOG,
  type TemplateCatalogItem,
} from "@/lib/template-catalog";

const categories = [
  { id: "all", name: "All Templates" },
  { id: "professional", name: "Professional" },
  { id: "tech", name: "Tech" },
  { id: "creative", name: "Creative" },
  { id: "executive", name: "Executive" },
  { id: "academic", name: "Academic" },
  { id: "modern", name: "Modern" },
];

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    const queryTemplate = searchParams.get("template");
    if (queryTemplate && isTemplateId(queryTemplate)) {
      setSelectedTemplate(queryTemplate);
    }
  }, [searchParams]);

  // Mock user data
  const user = {
    name: "John Doe",
    planType: "free",
  };

  const filteredTemplates = selectedCategory === "all"
    ? TEMPLATE_CATALOG
    : TEMPLATE_CATALOG.filter((t) => t.category === selectedCategory);

  const canUseTemplate = (template: TemplateCatalogItem) => {
    return !template.isPremium || user.planType !== "free";
  };
  const selectedTemplateData = selectedTemplate
    ? TEMPLATE_CATALOG.find((t) => t.id === selectedTemplate) || null
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                ResumeAI
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/templates" className="text-blue-600 font-medium">
                Templates
              </Link>
              <Link href="/tracker" className="text-gray-600 hover:text-gray-900">
                Tracker
              </Link>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.planType} Plan</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Templates</h1>
          <p className="text-gray-600">Choose from our collection of ATS-optimized templates designed to get you noticed.</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-lg ${
                selectedTemplate === template.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {/* Template Preview */}
              <div className="relative aspect-[8.5/11] bg-gray-100 group">
                <div className={`absolute inset-0 bg-gradient-to-br ${template.colors} opacity-10`} />
                <div className="absolute inset-0 p-4 flex flex-col">
                  <div className={`h-8 rounded bg-gradient-to-r ${template.colors} mb-3`} />
                  <div className="h-2 bg-gray-200 rounded w-2/3 mb-1" />
                  <div className="h-2 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="space-y-2 flex-1">
                    <div className={`h-1.5 rounded bg-gradient-to-r ${template.colors} w-1/3`} />
                    <div className="h-1.5 bg-gray-200 rounded w-full" />
                    <div className="h-1.5 bg-gray-200 rounded w-5/6" />
                    <div className="h-1.5 bg-gray-200 rounded w-4/5 mb-2" />
                    <div className={`h-1.5 rounded bg-gradient-to-r ${template.colors} w-1/3`} />
                    <div className="h-1.5 bg-gray-200 rounded w-full" />
                    <div className="h-1.5 bg-gray-200 rounded w-5/6" />
                    <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className={`h-1.5 rounded bg-gradient-to-r ${template.colors} w-1/3`} />
                    <div className="flex gap-1 flex-wrap mt-1">
                      {[40, 55, 35, 45, 60].map((w, j) => (
                        <div key={j} className={`h-3 rounded-full bg-gradient-to-r ${template.colors} opacity-30`} style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {template.isPopular && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </span>
                  )}
                  {template.isPremium && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      Pro
                    </span>
                  )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => setSelectedTemplate(template.id)}
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center hover:bg-gray-100 transition"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </button>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                {canUseTemplate(template) ? (
                  <button
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`w-full py-2 rounded-lg font-medium transition ${
                      selectedTemplate === template.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    {selectedTemplate === template.id ? (
                      <span className="flex items-center justify-center">
                        <Check className="h-4 w-4 mr-2" />
                        Selected
                      </span>
                    ) : (
                      "Select Template"
                    )}
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="w-full py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition flex items-center justify-center"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Upgrade to Use
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Template Action */}
        {selectedTemplateData && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Selected: {selectedTemplateData.name}
                </p>
                <p className="text-sm text-gray-600">
                  Ready to create your resume with this template
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                {canUseTemplate(selectedTemplateData) ? (
                  <Link
                    href={`/builder/new?template=${selectedTemplateData.id}`}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Use This Template
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  >
                    Upgrade to Use
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Banner for Free Users */}
        {user.planType === "free" && (
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlock All Premium Templates</h3>
                <p className="text-purple-100">
                  Upgrade to Pro and get access to 20+ premium templates designed by professionals.
                </p>
              </div>
              <Link
                href="/pricing"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition font-semibold shadow-xl whitespace-nowrap"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
