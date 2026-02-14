"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Download, Eye, Star, TrendingUp, Target, Clock, Loader2 } from "lucide-react";

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

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
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

  const user = data?.user;
  const stats = data?.stats;
  const resumes = data?.resumes ?? [];

  const userName = useMemo(() => user?.name || user?.email?.split('@')[0] || 'User', [user]);

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

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Link href="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
              <Link href="/templates" className="text-gray-600 hover:text-gray-900">Templates</Link>
              <Link href="/tracker" className="text-gray-600 hover:text-gray-900">Tracker</Link>
              <Link href="/profile" className="flex items-center space-x-3 hover:opacity-90 transition">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.planType} Plan</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {userName}!</h1>
          <p className="text-gray-600">
            You've created {user.resumesThisMonth}
            {user.resumesLimit === -1 ? ' of unlimited' : ` of ${user.resumesLimit}`} resumes this month.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalResumes}</span>
            </div>
            <p className="text-sm text-gray-600">Total Resumes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg"><TrendingUp className="h-6 w-6 text-green-600" /></div>
              <span className="text-2xl font-bold text-gray-900">{stats.avgScore}</span>
            </div>
            <p className="text-sm text-gray-600">Avg. ATS Score</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg"><Target className="h-6 w-6 text-purple-600" /></div>
              <span className="text-2xl font-bold text-gray-900">{stats.applications}</span>
            </div>
            <p className="text-sm text-gray-600">Applications</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg"><Star className="h-6 w-6 text-orange-600" /></div>
              <span className="text-2xl font-bold text-gray-900">{stats.interviews}</span>
            </div>
            <p className="text-sm text-gray-600">Interviews</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Next Resume</h2>
              <p className="text-blue-100">Optimized for ATS, powered by AI, ready in minutes</p>
            </div>
            <Link href="/builder/new" className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition font-semibold inline-flex items-center shadow-xl">
              <Plus className="mr-2 h-5 w-5" />
              New Resume
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Resumes</h2>
            {user.planType === "free" && (
              <Link href="/pricing" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Upgrade to create unlimited →
              </Link>
            )}
          </div>

          {resumes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
              <p className="text-gray-600 mb-6">Create your first ATS-optimized resume</p>
              <Link href="/builder/new" className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
                <Plus className="mr-2 h-5 w-5" />
                Create Resume
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{resume.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(resume.updatedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{resume.templateName}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          (resume.atsScore || 0) >= 90
                            ? "text-green-600"
                            : (resume.atsScore || 0) >= 75
                            ? "text-blue-600"
                            : "text-yellow-600"
                        }`}>
                          {resume.atsScore || 0}
                        </div>
                        <div className="text-xs text-gray-500">ATS Score</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link href={`/builder/${resume.id}`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Preview/Edit">
                          <Eye className="h-5 w-5" />
                        </Link>
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Download">
                          <Download className="h-5 w-5" />
                        </button>
                        <Link href={`/builder/${resume.id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
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
