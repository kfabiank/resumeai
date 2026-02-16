import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Mail, Lock, ArrowRight, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Authentication will be connected with Lovable Cloud. Coming soon!");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-stats relative items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="bg-brand rounded-lg p-2">
              <FileText className="h-7 w-7 text-brand-foreground" />
            </div>
            <span className="text-3xl font-display font-bold text-white">ResumeAI</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Build resumes that <span className="text-warm">beat the ATS</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Join 10,000+ professionals who've landed interviews using our AI-powered resume builder.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { value: "92%", label: "ATS pass rate" },
              { value: "3x", label: "More interviews" },
              { value: "<5min", label: "To create" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-lg p-3">
                <div className="text-lg font-display font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <div className="bg-brand rounded-lg p-1.5">
                <FileText className="h-5 w-5 text-brand-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">ResumeAI</span>
            </Link>
            <div className="lg:ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignUp ? "Start building ATS-optimized resumes" : "Sign in to continue building resumes"}
          </p>

          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2.5 bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground font-medium hover:bg-muted transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-background px-3 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-brand focus:border-transparent transition placeholder:text-muted-foreground/60"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-brand focus:border-transparent transition placeholder:text-muted-foreground/60"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-brand focus:border-transparent transition placeholder:text-muted-foreground/60"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-warm text-warm-foreground px-5 py-2.5 rounded-lg hover:opacity-90 transition font-semibold text-sm shadow-warm flex items-center justify-center"
            >
              {isSignUp ? "Create Account" : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-brand hover:underline font-medium"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          <p className="text-center text-[10px] text-muted-foreground/60 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
