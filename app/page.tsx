"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Zap, Target, TrendingUp, CheckCircle, Star, ArrowRight, Sparkles, BarChart3 } from "lucide-react";

const SAMPLE_RESUME = `John Doe
Software Engineer
john@email.com | (555) 123-4567 | San Francisco, CA

EXPERIENCE
Software Engineer at Tech Corp (2021 - Present)
- Worked on web applications
- Fixed bugs and added features
- Attended team meetings

Junior Developer at Startup Inc (2019 - 2021)
- Coded stuff
- Helped with projects

EDUCATION
BS Computer Science, Stanford University, 2019

SKILLS
JavaScript, React, Node.js, Python`;

const SAMPLE_JD = `We are looking for a Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience with React and Node.js
- Experience with TypeScript and microservices architecture
- Strong understanding of CI/CD pipelines and DevOps
- Experience with AWS, Docker, and Kubernetes
- Excellent communication and leadership skills
- Track record of delivering high-impact projects
- Experience with agile methodologies`;

const OPTIMIZED_RESUME = `John Doe
Senior Software Engineer
john@email.com | (555) 123-4567 | San Francisco, CA | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with 5+ years of experience building scalable React and Node.js applications. Proven track record of leading cross-functional teams and delivering high-impact projects using microservices architecture and CI/CD pipelines.

EXPERIENCE
Senior Software Engineer at Tech Corp (2021 - Present)
- Led development of microservices architecture serving 10M+ users, improving system reliability by 40%
- Implemented CI/CD pipeline with Docker and AWS, reducing deployment time from 2 hours to 15 minutes
- Mentored team of 5 engineers using agile methodologies, increasing team velocity by 30%
- Architected TypeScript-based React dashboard reducing customer support tickets by 25%

Software Engineer at Startup Inc (2019 - 2021)
- Developed Node.js microservices handling 1M+ daily events with 99.9% uptime
- Led migration to Kubernetes on AWS, cutting infrastructure costs by 35%
- Delivered 3 high-impact product features ahead of schedule using agile sprints

EDUCATION
BS Computer Science, Stanford University, 2019

SKILLS
Technical: React, TypeScript, Node.js, Python, AWS, Docker, Kubernetes, CI/CD
Soft: Leadership, Communication, Agile, Cross-functional Collaboration`;

function ATSDemo() {
  const [step, setStep] = useState<"input" | "analyzing" | "result">("input");
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME);
  const [jdText, setJdText] = useState(SAMPLE_JD);
  const [progress, setProgress] = useState(0);

  const runDemo = () => {
    setStep("analyzing");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStep("result");
          return 100;
        }
        return p + 5;
      });
    }, 80);
  };

  const reset = () => {
    setStep("input");
    setProgress(0);
    setResumeText(SAMPLE_RESUME);
    setJdText(SAMPLE_JD);
  };

  const beforeScore = 38;
  const afterScore = 91;

  const improvements = [
    { label: "Keywords matched", before: "4/20", after: "17/20", color: "text-green-600" },
    { label: "Action verbs", before: "2", after: "12", color: "text-green-600" },
    { label: "Quantifiable results", before: "0", after: "8", color: "text-green-600" },
    { label: "ATS formatting", before: "Poor", after: "Excellent", color: "text-green-600" },
  ];

  return (
    <section id="demo" className="py-20 px-4 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BarChart3 className="h-4 w-4" />
            <span>Live ATS Score Demo</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See the difference AI makes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Paste your resume and a job description — watch your ATS score transform in seconds.
          </p>
        </div>

        {step === "input" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Resume
                  <span className="ml-2 text-xs font-normal text-gray-500">(sample loaded)</span>
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={16}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-mono resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description
                  <span className="ml-2 text-xs font-normal text-gray-500">(sample loaded)</span>
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={16}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={runDemo}
                className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition text-lg font-semibold shadow-xl shadow-blue-600/30"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Analyze & Optimize with AI
              </button>
              <p className="text-sm text-gray-500 mt-3">
                This demo uses sample data. Sign up to use your real resume.
              </p>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI is analyzing your resume...</h3>
            <p className="text-gray-600 mb-8">Scanning keywords, formatting, and ATS compatibility</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Scanning keywords...</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-8">
            {/* Score Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="bg-white rounded-2xl shadow-sm border-2 border-red-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Before Optimization</h3>
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Original</span>
                </div>
                <div className="text-center mb-4">
                  <span className="text-6xl font-bold text-red-500">{beforeScore}</span>
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                  <div className="bg-red-400 h-3 rounded-full" style={{ width: `${beforeScore}%` }} />
                </div>
                <p className="text-center text-sm text-red-600 font-medium mt-1">Poor — Likely rejected by ATS</p>
              </div>

              {/* After */}
              <div className="bg-white rounded-2xl shadow-sm border-2 border-green-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">After AI Optimization</h3>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Optimized</span>
                </div>
                <div className="text-center mb-4">
                  <span className="text-6xl font-bold text-green-500">{afterScore}</span>
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${afterScore}%` }} />
                </div>
                <p className="text-center text-sm text-green-600 font-medium mt-1">Excellent — Ready to impress recruiters</p>
              </div>
            </div>

            {/* Improvements */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                What AI improved
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {improvements.map((item, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">{item.label}</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-red-400 line-through text-sm">{item.before}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className={`font-bold ${item.color}`}>{item.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimized Resume Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                AI-Optimized Resume
              </h3>
              <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                {OPTIMIZED_RESUME}
              </pre>
            </div>

            {/* CTA */}
            <div className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                Ready to optimize your real resume?
              </h3>
              <p className="text-blue-100 mb-6">
                Get your actual resume from <span className="font-bold text-white">{beforeScore}</span> to{" "}
                <span className="font-bold text-white">90+</span> in under 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/builder/new"
                  className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-semibold shadow-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Optimize My Resume Free
                </Link>
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center border-2 border-white/40 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                ResumeAI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#templates" className="text-gray-600 hover:text-gray-900 transition">Templates</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</a>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium transition">
                Sign In
              </Link>
              <Link 
                href="/dashboard" 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/30"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Resume Optimization</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Beat the ATS.<br />
              Land the <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Interview</span>.
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              75% of resumes never reach a human. Create ATS-optimized resumes with AI 
              that <span className="font-semibold text-gray-900">actually get you interviews</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/builder/new" 
                className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition text-lg font-semibold shadow-xl shadow-blue-600/30"
              >
                Create Resume Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a 
                href="#demo" 
                className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition text-lg font-semibold"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                See ATS Score Demo
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white" />
                  ))}
                </div>
                <span><strong className="text-gray-900">10,000+</strong> resumes created</span>
              </div>
              <div className="flex items-center">
                <div className="flex text-yellow-400 mr-2">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <span><strong className="text-gray-900">4.9/5</strong> rating</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span><strong className="text-gray-900">3x more</strong> interviews</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-4 border-b flex items-center space-x-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-sm text-gray-600 font-medium">
                  resume-builder.ai
                </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-blue-50 to-white">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Resume Preview */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 h-96 overflow-hidden">
                    <div className="space-y-4">
                      <div className="h-6 bg-gray-800 rounded w-3/4" />
                      <div className="h-4 bg-gray-300 rounded w-1/2" />
                      <div className="pt-4 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-5/6" />
                        <div className="h-3 bg-gray-200 rounded w-4/6" />
                      </div>
                      <div className="pt-4">
                        <div className="h-4 bg-blue-600 rounded w-1/3 mb-2" />
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-5/6" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ATS Score */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">ATS Score</span>
                        <span className="text-xs text-gray-500">Real-time</span>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex items-center justify-center mb-2">
                          <span className="text-5xl font-bold text-green-600">92</span>
                          <span className="text-2xl text-gray-400">/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style={{ width: "92%" }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Poor</span>
                          <span className="font-semibold text-green-600">Excellent ✓</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        Optimizations Applied
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2" />
                          <span className="text-gray-600">Added 12 relevant keywords</span>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2" />
                          <span className="text-gray-600">Improved bullet points clarity</span>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2" />
                          <span className="text-gray-600">ATS-friendly formatting</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -left-6 bg-white rounded-lg shadow-xl border border-gray-200 p-4 hidden lg:block animate-pulse">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">AI Optimizing...</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-xl border border-gray-200 p-4 hidden lg:block">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">+35 points</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ATS Score Demo Section */}
      <ATSDemo />

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">75%</div>
              <div className="text-blue-100">Resumes rejected by ATS</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">6s</div>
              <div className="text-blue-100">Average resume review time</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">3x</div>
              <div className="text-blue-100">More interviews with our users</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">&lt;5min</div>
              <div className="text-blue-100">To create optimized resume</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to land your dream job
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by advanced AI to give you an unfair advantage in your job search
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition">
              <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Sparkles className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Generation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our AI analyzes job descriptions and automatically generates optimized bullet points 
                that match the role perfectly.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Keyword extraction from job posts</span>
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Industry-specific language</span>
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Quantifiable achievements</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition">
              <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-Time ATS Scoring</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                See your ATS score update in real-time as you edit. Know exactly where you stand 
                before you apply.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>0-100 score breakdown</span>
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Specific improvement suggestions</span>
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Keyword match analysis</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition">
              <div className="bg-purple-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional Templates</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Choose from 20+ professionally designed templates that look great and pass ATS 
                systems with flying colors.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>ATS-friendly formats</span>
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Customizable colors & fonts</span>
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Export to PDF & DOCX</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition">
              <div className="bg-orange-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Cover Letter Generator</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate personalized cover letters in seconds. Perfectly matched to the job and your experience.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition">
              <div className="bg-pink-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Application Tracker</h3>
              <p className="text-gray-600 leading-relaxed">
                Track all your applications in one place. Never miss a follow-up or interview.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition">
              <div className="bg-indigo-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">LinkedIn Optimizer</h3>
              <p className="text-gray-600 leading-relaxed">
                Optimize your LinkedIn profile to match your resume and attract more recruiters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get hired in 4 simple steps
            </h2>
            <p className="text-xl text-gray-600">
              From zero to interview-ready in under 10 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "1", title: "Paste Job Description", desc: "Copy the job posting you're applying for", icon: FileText },
              { num: "2", title: "Add Your Info", desc: "Fill in your experience and education", icon: Sparkles },
              { num: "3", title: "AI Optimizes", desc: "Watch AI create perfect bullet points", icon: Zap },
              { num: "4", title: "Export & Apply", desc: "Download and send to employers", icon: Target },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    {step.num}
                  </div>
                  <step.icon className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
                {step.num !== "4" && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/builder/new" 
              className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition text-lg font-semibold shadow-xl shadow-blue-600/30"
            >
              Start Building Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <FileText className="h-4 w-4" />
              <span>Professional Templates</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Templates designed to get noticed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every template is ATS-optimized, recruiter-approved, and fully customizable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
            {[
              { name: "Modern Professional", category: "Professional", free: true, popular: true, colors: "from-blue-500 to-blue-700" },
              { name: "Tech Minimal", category: "Tech", free: true, popular: false, colors: "from-slate-600 to-slate-800" },
              { name: "Executive Classic", category: "Executive", free: false, popular: false, colors: "from-gray-700 to-gray-900" },
              { name: "Creative Bold", category: "Creative", free: false, popular: false, colors: "from-purple-500 to-purple-700" },
              { name: "Simple Clean", category: "Modern", free: true, popular: false, colors: "from-teal-500 to-teal-700" },
              { name: "Startup Modern", category: "Tech", free: false, popular: false, colors: "from-orange-500 to-orange-700" },
              { name: "Consultant Pro", category: "Professional", free: false, popular: false, colors: "from-indigo-500 to-indigo-700" },
              { name: "Academic Formal", category: "Academic", free: true, popular: false, colors: "from-green-600 to-green-800" },
            ].map((template, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 aspect-[8.5/11] mb-3">
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
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {template.popular && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center">
                        <Star className="h-3 w-3 mr-1 fill-current" /> Popular
                      </span>
                    )}
                    {template.free ? (
                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Free</span>
                    ) : (
                      <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Pro</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link
                      href={`/builder/new?template=${template.name.toLowerCase().replace(/ /g, "-")}`}
                      className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition"
                    >
                      Use Template
                    </Link>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{template.name}</p>
                <p className="text-xs text-gray-500">{template.category}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/templates"
              className="inline-flex items-center border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition font-semibold"
            >
              Browse All Templates
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free. Upgrade when you're ready.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 hover:shadow-xl transition">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600 mb-6">Perfect to get started</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600">/forever</span>
                </div>
                <Link 
                  href="/dashboard" 
                  className="block w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold text-center"
                >
                  Get Started
                </Link>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">3 resumes per month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">5 templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Basic ATS score</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">PDF export</span>
                </li>
              </ul>
            </div>

            {/* Pro Plan - Most Popular */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl border-2 border-blue-600 p-8 transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <p className="text-blue-100 mb-6">Best for job seekers</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">$19</span>
                  <span className="text-blue-100">/month</span>
                </div>
                <Link 
                  href="/dashboard" 
                  className="block w-full bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition font-semibold text-center shadow-lg"
                >
                  Start Free Trial
                </Link>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Unlimited resumes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">20+ premium templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Advanced ATS scoring</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Cover letter generator</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">PDF + DOCX export</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 hover:shadow-xl transition">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <p className="text-gray-600 mb-6">For serious professionals</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">$49</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <Link 
                  href="/dashboard" 
                  className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-center shadow-lg"
                >
                  Start Free Trial
                </Link>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Everything in Pro</strong></span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">LinkedIn optimizer</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Application tracker</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Interview prep AI</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">White-label templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8">
            All plans include 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to land your dream job?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 10,000+ job seekers who've landed interviews with ResumeAI
          </p>
          <Link 
            href="/builder/new" 
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition text-lg font-semibold shadow-xl"
          >
            Create Your Resume Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-blue-100 mt-4 text-sm">
            No credit card required · 3 free resumes · Takes 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ResumeAI</span>
              </div>
              <p className="text-sm">
                AI-powered resume builder that helps you land more interviews.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#templates" className="hover:text-white transition">Templates</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Examples</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Resume Tips</a></li>
                <li><a href="#" className="hover:text-white transition">ATS Guide</a></li>
                <li><a href="#" className="hover:text-white transition">Career Advice</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2024 ResumeAI. All rights reserved. Made with ❤️ for job seekers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
