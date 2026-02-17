import { useState } from "react";
import { Sparkles, BarChart3, ArrowRight, TrendingUp, CheckCircle } from "lucide-react";

const SAMPLE_RESUME = `John Doe
Software Engineer
john@email.com | (555) 123-4567 | San Francisco, CA

EXPERIENCE
Software Engineer at Tech Corp (2021 - Present)
- Worked on web applications
- Fixed bugs and added features

Junior Developer at Startup Inc (2019 - 2021)
- Coded stuff
- Helped with projects

EDUCATION
BS Computer Science, Stanford University, 2019

SKILLS
JavaScript, React, Node.js, Python`;

const SAMPLE_JD = `We are looking for a Senior Software Engineer.

Requirements:
- 5+ years of experience with React and Node.js
- Experience with TypeScript and microservices
- Strong understanding of CI/CD pipelines
- Experience with AWS, Docker, and Kubernetes
- Excellent communication and leadership skills`;

export function ATSDemo() {
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
    { label: "Keywords matched", before: "4/20", after: "17/20" },
    { label: "Action verbs", before: "2", after: "12" },
    { label: "Quantifiable results", before: "0", after: "8" },
    { label: "ATS formatting", before: "Poor", after: "Excellent" },
  ];

  return (
    <section id="demo" className="py-20 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand border border-brand/20 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase">
            <BarChart3 className="h-3.5 w-3.5" />
            Live ATS Score Demo
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            See the difference AI makes
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Paste your resume and a job description — watch your ATS score transform in seconds.
          </p>
        </div>

        {step === "input" && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Your Resume
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(sample loaded)</span>
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent text-xs font-mono resize-none bg-card text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Job Description
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(sample loaded)</span>
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent text-xs resize-none bg-card text-foreground"
                />
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={runDemo}
                className="inline-flex items-center bg-warm text-warm-foreground px-7 py-3 rounded-xl hover:opacity-90 transition text-sm font-bold shadow-warm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze & Optimize with AI
              </button>
              <p className="text-[10px] text-muted-foreground mt-2">
                This demo uses sample data. Sign up to use your real resume.
              </p>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="bg-card rounded-2xl border border-border p-10 text-center max-w-md mx-auto animate-fade-in">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Sparkles className="h-8 w-8 text-brand animate-pulse" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mb-1">AI is analyzing your resume…</h3>
            <p className="text-sm text-muted-foreground mb-6">Scanning keywords, formatting, and ATS compatibility</p>
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div
                className="bg-brand h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Scanning keywords…</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border-2 border-destructive/20 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-foreground text-sm">Before Optimization</h3>
                  <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full font-semibold">Original</span>
                </div>
                <div className="text-center mb-3">
                  <span className="text-5xl font-display font-extrabold text-destructive">{beforeScore}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div className="bg-destructive/50 h-2 rounded-full" style={{ width: `${beforeScore}%` }} />
                </div>
                <p className="text-center text-xs text-destructive font-medium mt-1">Poor — Likely rejected by ATS</p>
              </div>

              <div className="bg-card rounded-2xl border-2 border-success/20 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-foreground text-sm">After AI Optimization</h3>
                  <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-semibold">Optimized</span>
                </div>
                <div className="text-center mb-3">
                  <span className="text-5xl font-display font-extrabold text-success">{afterScore}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div className="bg-success h-2 rounded-full" style={{ width: `${afterScore}%` }} />
                </div>
                <p className="text-center text-xs text-success font-medium mt-1">Excellent — Ready to impress</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-brand" />
                What AI improved
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {improvements.map((item, i) => (
                  <div key={i} className="text-center p-3 bg-muted rounded-xl">
                    <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-destructive/50 line-through text-xs">{item.before}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="font-bold text-success text-xs">{item.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center bg-gradient-stats rounded-2xl p-7">
              <h3 className="font-display text-xl font-bold text-brand-foreground mb-2">
                Ready to optimize your real resume?
              </h3>
              <p className="text-sm text-brand-foreground/60 mb-5">
                Get your resume from <span className="font-bold text-brand-foreground">{beforeScore}</span> to{" "}
                <span className="font-bold text-brand-foreground">90+</span> in under 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center bg-warm text-warm-foreground px-6 py-2.5 rounded-lg hover:opacity-90 transition font-bold text-sm shadow-warm"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Optimize My Resume Free
                </a>
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center border border-white/20 text-brand-foreground px-5 py-2.5 rounded-lg hover:bg-white/10 transition font-medium text-sm"
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
