import { Link } from "react-router-dom";
import {
  FileText, Sparkles, Target, Zap, TrendingUp, CheckCircle,
  Star, ArrowRight, BarChart3, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { ATSDemo } from "@/components/ATSDemo";
import { TemplatesSection } from "@/components/TemplatesSection";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md fixed w-full z-50 shadow-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-brand rounded-lg p-1.5">
                <FileText className="h-5 w-5 text-brand-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">
                ResumeAI
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">Features</a>
              <a href="#templates" className="text-sm text-muted-foreground hover:text-foreground transition">Templates</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition">Pricing</a>
              <ThemeToggle />
              <Link to="/login" className="text-sm font-medium text-foreground hover:text-brand transition">
                Sign In
              </Link>
              <Link
                to="/login"
                className="bg-brand text-brand-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-brand"
              >
                Get Started Free
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground p-2" aria-label="Menu">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4 space-y-3 animate-slide-up">
              <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#templates" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Templates</a>
              <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <Link to="/login" className="block text-sm font-medium text-foreground">Sign In</Link>
              <Link to="/login" className="block bg-brand text-brand-foreground px-5 py-2.5 rounded-lg text-sm font-semibold text-center shadow-brand">Get Started Free</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4 bg-gradient-hero">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand border border-brand/20 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Resume Optimization
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-5 leading-[1.1] tracking-tight">
              Beat the ATS.{" "}
              <span className="text-gradient-warm">Land the Interview.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              75% of resumes never reach a human. Create ATS-optimized resumes with AI
              that <span className="font-semibold text-foreground">actually get you interviews</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-warm text-warm-foreground px-7 py-3.5 rounded-lg hover:opacity-90 transition text-sm font-bold shadow-warm"
              >
                Create Resume Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center border border-border text-foreground px-7 py-3.5 rounded-lg hover:bg-muted transition text-sm font-semibold"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                See ATS Score Demo
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-warm border-2 border-background" />
                  ))}
                </div>
                <span><strong className="text-foreground">10,000+</strong> resumes created</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex text-warning">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                <span><strong className="text-foreground">4.9/5</strong> rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-success" />
                <span><strong className="text-foreground">3x more</strong> interviews</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl shadow-card-hover border border-border overflow-hidden">
              <div className="bg-muted px-5 py-3 border-b border-border flex items-center">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/50" />
                  <div className="w-3 h-3 rounded-full bg-warning/50" />
                  <div className="w-3 h-3 rounded-full bg-success/50" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground font-medium">
                  resume-builder.ai
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Resume preview skeleton */}
                  <div className="bg-background rounded-lg border border-border p-5 space-y-3">
                    <div className="h-5 bg-foreground/10 rounded w-3/4" />
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                    <div className="pt-3 space-y-2">
                      <div className="h-2.5 bg-border rounded w-full" />
                      <div className="h-2.5 bg-border rounded w-5/6" />
                      <div className="h-2.5 bg-border rounded w-4/6" />
                    </div>
                    <div className="pt-3">
                      <div className="h-3.5 bg-brand/20 rounded w-1/3 mb-2" />
                      <div className="space-y-2">
                        <div className="h-2.5 bg-border rounded w-full" />
                        <div className="h-2.5 bg-border rounded w-5/6" />
                      </div>
                    </div>
                    <div className="pt-3">
                      <div className="h-3.5 bg-brand/20 rounded w-1/4 mb-2" />
                      <div className="flex gap-2 flex-wrap">
                        {["TypeScript", "React", "Node.js"].map(s => (
                          <span key={s} className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ATS Score + Optimizations */}
                  <div className="space-y-4">
                    <div className="bg-background rounded-lg border border-border p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ATS Score</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Real-time</span>
                      </div>
                      <div className="flex items-baseline justify-center gap-1 mb-3">
                        <span className="text-5xl font-display font-extrabold text-success">92</span>
                        <span className="text-lg text-muted-foreground font-medium">/100</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-success h-2 rounded-full transition-all" style={{ width: "92%" }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>Poor</span>
                        <span className="font-semibold text-success">Excellent ✓</span>
                      </div>
                    </div>

                    <div className="bg-background rounded-lg border border-border p-5">
                      <h4 className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Optimizations Applied
                      </h4>
                      <div className="space-y-2 text-xs">
                        {["Added 12 relevant keywords", "Improved bullet points clarity", "ATS-friendly formatting"].map((text) => (
                          <div key={text} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -left-4 bg-card rounded-lg shadow-card-hover border border-border px-3 py-2 hidden lg:flex items-center gap-2 animate-pulse-slow">
              <Zap className="h-4 w-4 text-warm" />
              <span className="text-xs font-semibold text-foreground">AI Optimizing…</span>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-card rounded-lg shadow-card-hover border border-border px-3 py-2 hidden lg:flex items-center gap-2">
              <Target className="h-4 w-4 text-success" />
              <span className="text-xs font-semibold text-foreground">+35 points</span>
            </div>
          </div>
        </div>
      </section>

      {/* ATS Demo */}
      <ATSDemo />

      {/* Stats */}
      <section className="py-14 bg-gradient-stats">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "75%", label: "Resumes rejected by ATS" },
              { value: "6s", label: "Average resume review time" },
              { value: "3x", label: "More interviews with our users" },
              { value: "<5min", label: "To create optimized resume" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-display font-extrabold text-brand-foreground mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-brand-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              Everything you need to land your dream job
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Powered by advanced AI to give you an unfair advantage in your job search
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Sparkles,
                iconBg: "bg-brand/10",
                iconColor: "text-brand",
                title: "AI-Powered Generation",
                desc: "Our AI analyzes job descriptions and generates optimized bullet points that match the role.",
                bullets: ["Keyword extraction from job posts", "Industry-specific language", "Quantifiable achievements"],
              },
              {
                icon: Target,
                iconBg: "bg-success/10",
                iconColor: "text-success",
                title: "Real-Time ATS Scoring",
                desc: "See your ATS score update in real-time as you edit. Know where you stand before you apply.",
                bullets: ["0-100 score breakdown", "Improvement suggestions", "Keyword match analysis"],
              },
              {
                icon: FileText,
                iconBg: "bg-warm/10",
                iconColor: "text-warm",
                title: "Professional Templates",
                desc: "Choose from 20+ professionally designed templates that pass ATS systems.",
                bullets: ["ATS-friendly formats", "Customizable colors & fonts", "Export to PDF & DOCX"],
              },
              {
                icon: Zap,
                iconBg: "bg-warning/10",
                iconColor: "text-warning",
                title: "Cover Letter Generator",
                desc: "Generate personalized cover letters in seconds. Perfectly matched to the job.",
              },
              {
                icon: TrendingUp,
                iconBg: "bg-destructive/10",
                iconColor: "text-destructive",
                title: "Application Tracker",
                desc: "Track all your applications in one place. Never miss a follow-up or interview.",
              },
              {
                icon: BarChart3,
                iconBg: "bg-brand/10",
                iconColor: "text-brand",
                title: "LinkedIn Optimizer",
                desc: "Optimize your LinkedIn profile to match your resume and attract more recruiters.",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-card rounded-xl border border-border p-6 hover:shadow-card-hover transition-shadow group">
                <div className={`${feature.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{feature.desc}</p>
                {feature.bullets && (
                  <ul className="space-y-1.5">
                    {feature.bullets.map((b) => (
                      <li key={b} className="flex items-start text-xs text-muted-foreground gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              Get hired in 4 simple steps
            </h2>
            <p className="text-base text-muted-foreground">
              From zero to interview-ready in under 10 minutes
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { num: "1", title: "Paste Job Description", desc: "Copy the job posting you're applying for", icon: FileText },
              { num: "2", title: "Add Your Info", desc: "Fill in your experience and education", icon: Sparkles },
              { num: "3", title: "AI Optimizes", desc: "Watch AI create perfect bullet points", icon: Zap },
              { num: "4", title: "Export & Apply", desc: "Download and send to employers", icon: Target },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="bg-card rounded-xl border border-border p-5 hover:shadow-card-hover transition-shadow h-full">
                  <div className="bg-warm text-warm-foreground w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mb-3 font-display">
                    {step.num}
                  </div>
                  <step.icon className="h-6 w-6 text-brand mb-2" />
                  <h3 className="font-display text-base font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                {step.num !== "4" && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2">
                    <ArrowRight className="h-4 w-4 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/login"
              className="inline-flex items-center bg-warm text-warm-foreground px-7 py-3.5 rounded-lg hover:opacity-90 transition text-sm font-bold shadow-warm"
            >
              Start Building Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Templates */}
      <TemplatesSection />

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-base text-muted-foreground">
              Start free. Upgrade when you're ready.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
            {/* Free */}
            <div className="bg-card rounded-2xl border border-border p-7 hover:shadow-card-hover transition-shadow">
              <h3 className="font-display text-xl font-bold text-foreground mb-1">Free</h3>
              <p className="text-sm text-muted-foreground mb-5">Perfect to get started</p>
              <div className="mb-5">
                <span className="text-4xl font-display font-extrabold text-foreground">$0</span>
                <span className="text-sm text-muted-foreground">/forever</span>
              </div>
              <Link to="/login" className="block w-full bg-muted text-foreground px-5 py-2.5 rounded-lg hover:bg-border transition font-semibold text-center text-sm">
                Get Started
              </Link>
              <ul className="mt-6 space-y-3">
                {["3 resumes per month", "5 templates", "Basic ATS score", "PDF export"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-card rounded-2xl border-2 border-warm p-7 shadow-warm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-warm text-warm-foreground px-3 py-0.5 rounded-full text-xs font-bold shadow-warm">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-1">Pro</h3>
              <p className="text-sm text-muted-foreground mb-5">Best for job seekers</p>
              <div className="mb-5">
                <span className="text-4xl font-display font-extrabold text-foreground">$19</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <Link to="/login" className="block w-full bg-warm text-warm-foreground px-5 py-2.5 rounded-lg hover:opacity-90 transition font-semibold text-center text-sm shadow-warm">
                Start Free Trial
              </Link>
              <ul className="mt-6 space-y-3">
                {["Unlimited resumes", "20+ premium templates", "Advanced ATS scoring", "Cover letter generator", "PDF + DOCX export", "Priority support"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-warm mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <div className="bg-card rounded-2xl border border-border p-7 hover:shadow-card-hover transition-shadow">
              <h3 className="font-display text-xl font-bold text-foreground mb-1">Premium</h3>
              <p className="text-sm text-muted-foreground mb-5">For serious professionals</p>
              <div className="mb-5">
                <span className="text-4xl font-display font-extrabold text-foreground">$49</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <Link to="/login" className="block w-full bg-brand text-brand-foreground px-5 py-2.5 rounded-lg hover:opacity-90 transition font-semibold text-center text-sm shadow-brand">
                Start Free Trial
              </Link>
              <ul className="mt-6 space-y-3">
                {["Everything in Pro", "LinkedIn optimizer", "Application tracker", "Interview prep AI", "White-label templates", "API access"].map((f, i) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span className={`${i === 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            All plans include 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-stats">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-foreground mb-4 tracking-tight">
            Ready to land your dream job?
          </h2>
          <p className="text-base text-brand-foreground/70 mb-8">
            Join 10,000+ job seekers who've landed interviews with ResumeAI
          </p>
          <Link
            to="/login"
            className="inline-flex items-center bg-warm text-warm-foreground px-7 py-3.5 rounded-lg hover:opacity-90 transition text-sm font-bold shadow-warm"
          >
            Create Your Resume Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="text-brand-foreground/50 mt-4 text-xs">
            No credit card required · 3 free resumes · Takes 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-footer text-footer-foreground py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-brand rounded-lg p-1.5">
                  <FileText className="h-4 w-4 text-brand-foreground" />
                </div>
                <span className="text-lg font-display font-bold text-white">ResumeAI</span>
              </div>
              <p className="text-sm leading-relaxed">
                AI-powered resume builder that helps you land more interviews.
              </p>
            </div>
            <div>
              <h4 className="text-white font-display font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#templates" className="hover:text-white transition">Templates</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-display font-semibold mb-3 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Resume Tips</a></li>
                <li><a href="#" className="hover:text-white transition">ATS Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-display font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-xs">
            <p>© 2025 ResumeAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
