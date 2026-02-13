"use client";

import Link from "next/link";
import { FileText, Plus, Download, Eye, Trash2, Star, TrendingUp, Target, Clock } from "lucide-react";

export default function DashboardPage() {
  // Mock data - en producción vendrá de la base de datos
  const user = {
    name: "John Doe",
    email: "john@example.com",
    planType: "free",
    resumesThisMonth: 2,
    resumesLimit: 3,
  };

  const resumes = [
    {
      id: "1",
      title: "Software Engineer - Tech Corp",
      atsScore: 92,
      updatedAt: "2024-02-10",
      templateName: "Modern Professional",
    },
    {
      id: "2",
      title: "Senior Developer - Startup",
      atsScore: 87,
      updatedAt: "2024-02-08",
      templateName: "Tech Minimal",
    },
  ];

  const stats = {
    totalResumes: 2,
    avgScore: 89.5,
    applications: 5,
    interviews: 2,
  };

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
              <Link href="/dashboard" className="text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/templates" className="text-gray-600 hover:text-gray-900">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}! 👋</h1>
          <p className="text-gray-600">You've created {user.resumesThisMonth} of {user.resumesLimit} resumes this month.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalResumes}</span>
            </div>
            <p className="text-sm text-gray-600">Total Resumes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.avgScore}</span>
            </div>
            <p className="text-sm text-gray-600">Avg. ATS Score</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.applications}</span>
            </div>
            <p className="text-sm text-gray-600">Applications</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.interviews}</span>
            </div>
            <p className="text-sm text-gray-600">Interviews</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Next Resume</h2>
              <p className="text-blue-100">Optimized for ATS, powered by AI, ready in minutes</p>
            </div>
            <Link
              href="/builder/new"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition font-semibold inline-flex items-center shadow-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Resume
            </Link>
          </div>
        </div>

        {/* Resumes List */}
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
              <Link
                href="/builder/new"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Resume
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {resume.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {resume.updatedAt}
                        </span>
                        <span>•</span>
                        <span>{resume.templateName}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* ATS Score Badge */}
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            resume.atsScore >= 90
                              ? "text-green-600"
                              : resume.atsScore >= 75
                              ? "text-blue-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {resume.atsScore}
                        </div>
                        <div className="text-xs text-gray-500">ATS Score</div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Preview"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Download"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <Link
                          href={`/builder/${resume.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
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

        {/* Upgrade Banner for Free Users */}
        {user.planType === "free" && (
          <div className="mt-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlock Unlimited Resumes</h3>
                <p className="text-purple-100 mb-4">
                  Upgrade to Pro and create unlimited ATS-optimized resumes + get cover letters
                </p>
                <ul className="space-y-2 text-purple-100">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-400" />
                    Unlimited resume creation
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-400" />
                    20+ premium templates
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-400" />
                    Cover letter generator
                  </li>
                </ul>
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
