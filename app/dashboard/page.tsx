"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Download, Eye, Star, TrendingUp, Target, Clock, Loader2 } from "lucide-react";
import AppTopNav from "@/components/AppTopNav";

type DashboardData = {
  user: {
    id: string;
    name: string | null;
    email: string;
    planType: string;
    resumesThisMonth: number;
    resumesLimit: number;
  };
  stats: {
    totalResumes: number;
    avgScore: number;
    applications: number;
    interviews: number;
  };
  resumes: Array<{
    id: string;
    title: string;
    atsScore: number | null;
    updatedAt: string;
    templateName: string;
    templateId: string;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortByScore, setSortByScore] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard', { cache: 'no-store' });
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load dashboard');
        setData(body);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  const userName = useMemo(
    () => data?.user?.name || data?.user?.email?.split("@")[0] || "User",
    [data]
  );

  const sortedResumes = useMemo(() => {
    const resumes = data?.resumes || [];
    if (!sortByScore || resumes.length === 0) return resumes;
    return [...resumes].sort((a, b) => {
      const scoreA = a.atsScore || 0;
      const scoreB = b.atsScore || 0;
      return scoreB - scoreA; // Sort descending
    });
  }, [data?.resumes, sortByScore]);

  const handleAvgScoreClick = () => {
    setSortByScore(true);
    // Scroll to resumes section
    setTimeout(() => {
      const resumesSection = document.getElementById('resumes-section');
      if (resumesSection) {
        resumesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-gray-900 font-semibold mb-2">Could not load dashboard</p>
          <p className="text-gray-600 text-sm">{error || 'Try refreshing the page.'}</p>
        </div>
      </div>
    );
  }

  const { user, stats, resumes } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <AppTopNav active="dashboard" userName={userName} planType={user.planType} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Welcome back, {userName}!</h1>
          <p className="text-slate-600 text-lg">
            You've created <span className="font-semibold text-slate-900">{user.resumesThisMonth}</span>
            {user.resumesLimit === -1 ? ' of unlimited' : ` of ${user.resumesLimit}`} resumes this month.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{stats.totalResumes}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Total Resumes</p>
          </div>

          <button
            onClick={handleAvgScoreClick}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/50 transition-all duration-200 cursor-pointer text-left w-full group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{stats.avgScore}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Avg. ATS Score</p>
            {sortByScore && (
              <p className="text-xs text-emerald-600 mt-2 font-semibold flex items-center gap-1">
                <span>Sorted by score</span>
                <span>↓</span>
              </p>
            )}
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-xl">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{stats.applications}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Applications</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-50 p-3 rounded-xl">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{stats.interviews}</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Interviews</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/20 p-8 mb-10 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Next Resume</h2>
              <p className="text-blue-100 text-lg">Optimized for ATS, powered by AI, ready in minutes</p>
            </div>
            <Link href="/builder/new" className="bg-white text-blue-600 px-6 py-3.5 rounded-xl hover:bg-blue-50 transition-all font-semibold inline-flex items-center shadow-lg hover:shadow-xl hover:scale-105 transform duration-200 whitespace-nowrap">
              <Plus className="mr-2 h-5 w-5" />
              New Resume
            </Link>
          </div>
        </div>

        <div id="resumes-section" className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">My Resumes</h2>
            {user.planType === "free" && (
              <Link href="/pricing" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Upgrade to create unlimited
                <span>→</span>
              </Link>
            )}
          </div>

          {sortedResumes.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 mb-6">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No resumes yet</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">Create your first ATS-optimized resume and start landing more interviews</p>
              <Link href="/builder/new" className="inline-flex items-center bg-blue-600 text-white px-6 py-3.5 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform duration-200">
                <Plus className="mr-2 h-5 w-5" />
                Create Resume
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedResumes.map((resume) => (
                <div key={resume.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md hover:shadow-blue-50/50 transition-all duration-200 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{resume.title}</h3>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {new Date(resume.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-slate-600 font-medium">{resume.templateName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                        <div className={`text-2xl font-bold ${
                          (resume.atsScore || 0) >= 90
                            ? "text-emerald-600"
                            : (resume.atsScore || 0) >= 75
                            ? "text-blue-600"
                            : "text-amber-600"
                        }`}>
                          {resume.atsScore || 0}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">ATS Score</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link href={`/builder/${resume.id}`} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Preview/Edit">
                          <Eye className="h-5 w-5" />
                        </Link>
                        <button className="p-2.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Download">
                          <Download className="h-5 w-5" />
                        </button>
                        <Link href={`/builder/${resume.id}`} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md">
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
