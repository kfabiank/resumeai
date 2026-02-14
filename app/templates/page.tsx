"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Check, Lock, Eye, Star } from "lucide-react";
import TopNav from "@/components/top-nav";
import { useDemoUser } from "@/hooks/use-demo-user";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  isPremium: boolean;
  isPopular?: boolean;
}

const templates: Template[] = [
  {
    id: "modern-professional",
    name: "Modern Professional",
    description: "Clean and contemporary design perfect for corporate roles",
    category: "professional",
    thumbnail: "/templates/modern-professional.png",
    isPremium: false,
    isPopular: true,
  },
  {
    id: "tech-minimal",
    name: "Tech Minimal",
    description: "Sleek design optimized for tech and startup positions",
    category: "tech",
    thumbnail: "/templates/tech-minimal.png",
    isPremium: false,
  },
  {
    id: "executive-classic",
    name: "Executive Classic",
    description: "Elegant template for senior leadership positions",
    category: "executive",
    thumbnail: "/templates/executive-classic.png",
    isPremium: true,
  },
  {
    id: "creative-bold",
    name: "Creative Bold",
    description: "Stand out with this eye-catching creative design",
    category: "creative",
    thumbnail: "/templates/creative-bold.png",
    isPremium: true,
  },
  {
    id: "academic-formal",
    name: "Academic Formal",
    description: "Traditional format for academic and research positions",
    category: "academic",
    thumbnail: "/templates/academic-formal.png",
    isPremium: false,
  },
  {
    id: "startup-modern",
    name: "Startup Modern",
    description: "Dynamic template perfect for fast-paced environments",
    category: "tech",
    thumbnail: "/templates/startup-modern.png",
    isPremium: true,
  },
  {
    id: "consultant-pro",
    name: "Consultant Pro",
    description: "Professional template for consulting and advisory roles",
    category: "professional",
    thumbnail: "/templates/consultant-pro.png",
    isPremium: true,
  },
  {
    id: "simple-clean",
    name: "Simple Clean",
    description: "Minimalist design that lets your experience shine",
    category: "modern",
    thumbnail: "/templates/simple-clean.png",
    isPremium: false,
  },
];

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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { user } = useDemoUser();

  const filteredTemplates = selectedCategory === "all"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const canUseTemplate = (template: Template) => {
    return !template.isPremium || user.planType !== "free";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav active="templates" user={user} />

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
                {/* Placeholder for template thumbnail */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <span className="text-sm text-gray-500">{template.name}</span>
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
                  <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center hover:bg-gray-100 transition">
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
        {selectedTemplate && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Selected: {templates.find(t => t.id === selectedTemplate)?.name}
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
                <Link
                  href={`/builder/new?template=${selectedTemplate}`}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Use This Template
                </Link>
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
