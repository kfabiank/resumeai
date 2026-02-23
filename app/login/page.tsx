'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';

type ProviderMap = Awaited<ReturnType<typeof getProviders>>;

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12S6.6 21.7 12 21.7c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.45-2.13 2.94v5.66H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.27 2.38 4.27 5.47v6.27zM5.34 7.43c-1.14 0-2.07-.93-2.07-2.08 0-1.14.93-2.07 2.07-2.07 1.15 0 2.08.93 2.08 2.07 0 1.15-.93 2.08-2.08 2.08zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [providers, setProviders] = useState<ProviderMap | null>(null);
  const [providersReady, setProvidersReady] = useState(false);
  const [providersError, setProvidersError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const list = await getProviders();
        setProviders(list || ({} as ProviderMap));
      } catch {
        setProvidersError('Could not load login providers. Try refreshing.');
      } finally {
        setProvidersReady(true);
      }
    };
    void loadProviders();
  }, []);

  const hasGoogle = !!providers?.google;
  const hasLinkedIn = !!providers?.linkedin;
  const hasEmail = !!providers?.email;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setOauthError(params.get('error'));
  }, []);

  useEffect(() => {
    if (!oauthError) return;
    const errorMap: Record<string, string> = {
      OAuthSignin: 'Social sign-in could not be started.',
      OAuthCallback: 'OAuth callback failed. Check redirect URL in provider console.',
      OAuthCreateAccount: 'Could not create account from Google profile.',
      Callback: 'Authentication callback failed.',
      AccessDenied: 'Access denied by provider.',
      Configuration: 'Provider configuration error.',
      Verification: 'Verification token error.',
    };
    setAuthError(errorMap[oauthError] || `Auth error: ${oauthError}`);
  }, [oauthError]);

  async function handleGoogle() {
    setAuthError('');
    if (!providersReady) {
      setAuthError('Loading providers. Try again in a second.');
      return;
    }
    if (providers && !providers.google) {
      setAuthError('Google provider is not configured.');
      return;
    }

    try {
      setLoading(true);
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setAuthError('Could not start Google sign-in.');
      setLoading(false);
    }
  }

  async function handleLinkedIn() {
    setAuthError('');
    if (!providersReady) {
      setAuthError('Loading providers. Try again in a second.');
      return;
    }
    if (providers && !providers.linkedin) {
      setAuthError('LinkedIn provider is not configured.');
      return;
    }

    try {
      setLoading(true);
      await signIn('linkedin', { callbackUrl: '/dashboard' });
    } catch {
      setAuthError('Could not start LinkedIn sign-in.');
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setAuthError('');
    setEmailSent(false);

    let res;
    try {
      setLoading(true);
      if (password.trim()) {
        res = await signIn('credentials', {
          email,
          password,
          callbackUrl: '/dashboard',
          redirect: false,
        });
      } else {
        if (!providersReady) {
          setAuthError('Loading providers. Try again in a second.');
          return;
        }
        res = await signIn('email', {
          email,
          callbackUrl: '/dashboard',
          redirect: false,
        });
        setEmailSent(!res?.error);
      }
    } catch {
      setAuthError('Could not complete sign-in. Please try again.');
      return;
    } finally {
      setLoading(false);
    }
    if (res?.error) {
      setAuthError('Invalid credentials or provider not configured.');
      return;
    }
    if (password.trim() && res?.ok) {
      window.location.href = '/dashboard';
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-2">
      <section className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700 p-12">
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative z-10 my-auto max-w-xl text-white">
          <div className="mb-8 flex items-center gap-3">
            <Image
              src="/logo-b-neural-dark.svg"
              alt="Resuify"
              width={180}
              height={42}
              className="h-[3.25rem] w-auto"
            />
          </div>

          <h1 className="text-4xl font-extrabold leading-tight">
            Build resumes that beat ATS and get interviews.
          </h1>
          <p className="mt-4 max-w-lg text-base text-white/80">
            Create, optimize and export professional resumes in minutes with templates aligned to your plan.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-2xl font-bold">92%</p>
              <p className="mt-1 text-xs text-white/70">ATS pass rate</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-2xl font-bold">3x</p>
              <p className="mt-1 text-xs text-white/70">More interviews</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-2xl font-bold">&lt;5m</p>
              <p className="mt-1 text-xs text-white/70">To create</p>
            </div>
          </div>

          <div className="mt-10 space-y-3 text-sm text-white/80">
            <p className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              AI-powered keyword and ATS optimization.
            </p>
            <p className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-200" />
              Track improvements with ATS Insights and applications.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 lg:hidden">
              <Image
                src="/logo-b-neural.svg"
                alt="Resuify"
                width={150}
                height={34}
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm text-slate-500 lg:ml-auto">Secure sign in</p>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sign in your account</h1>
          <p className="mt-2 text-slate-500">Continue building your resume and track your applications.</p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleLinkedIn}
              disabled={loading || !providersReady || !hasLinkedIn}
              className="flex h-12 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <LinkedInMark />
              LinkedIn
            </button>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || !providersReady || !hasGoogle}
              className="flex h-12 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <GoogleMark />
              Google
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs uppercase tracking-wide text-slate-400">or use your email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Optional (leave empty for magic link)"
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !providersReady || (!password.trim() && !hasEmail)}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-white font-semibold transition hover:bg-emerald-600 disabled:opacity-60"
            >
              Sign In
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            {providersError && <p className="text-sm text-red-600">{providersError}</p>}
            {emailSent && <p className="text-sm text-emerald-600">Magic link sent. Check your email.</p>}
            {authError && <p className="text-sm text-red-600">{authError}</p>}
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </section>
    </main>
  );
}
