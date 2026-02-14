'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Facebook, Flame, Lightbulb, Linkedin, PiggyBank } from 'lucide-react';

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

export default function LoginPage() {
  const [providers, setProviders] = useState<ProviderMap | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    void getProviders().then(setProviders);
  }, []);

  const hasGoogle = !!providers?.google;
  const hasLinkedIn = !!providers?.linkedin;
  const hasFacebook = !!providers?.facebook;
  const hasEmail = !!providers?.email;

  async function handleGoogle() {
    setLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
    setLoading(false);
  }

  async function handleLinkedIn() {
    setLoading(true);
    await signIn('linkedin', { callbackUrl: '/dashboard' });
    setLoading(false);
  }

  async function handleFacebook() {
    setLoading(true);
    await signIn('facebook', { callbackUrl: '/dashboard' });
    setLoading(false);
  }

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setAuthError('');
    setEmailSent(false);

    setLoading(true);
    let res;
    if (password.trim()) {
      res = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/dashboard',
        redirect: false,
      });
    } else {
      res = await signIn('email', {
        email,
        callbackUrl: '/dashboard',
        redirect: false,
      });
      setEmailSent(!res?.error);
    }

    setLoading(false);
    if (res?.error) {
      setAuthError('Invalid credentials or provider not configured.');
      return;
    }
    if (password.trim() && res?.ok) {
      window.location.href = '/dashboard';
    }
  }

  return (
    <main className="min-h-screen bg-[#ecebf4] px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-6 rounded-2xl md:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl p-8 md:p-10 flex flex-col justify-center">
          <h1 className="text-5xl leading-tight font-semibold text-slate-800 max-w-xs">
            Create a resume you are proud of
          </h1>

          <ul className="mt-10 space-y-8 text-slate-600 text-lg">
            <li className="flex items-start gap-4">
              <PiggyBank className="h-7 w-7 text-indigo-500 mt-1" />
              <span>Save time with hassle-free templates</span>
            </li>
            <li className="flex items-start gap-4">
              <Lightbulb className="h-7 w-7 text-indigo-500 mt-1" />
              <span>Beat the competition using actionable, contextual advice</span>
            </li>
            <li className="flex items-start gap-4">
              <Flame className="h-7 w-7 text-indigo-500 mt-1" />
              <span>Highlight key achievements with memorable visuals</span>
            </li>
          </ul>

          <p className="mt-10 text-2xl text-slate-700">
            Get inspired by{' '}
            <span className="font-semibold text-indigo-600">1800+ Free Resume Examples and Templates</span>
          </p>
        </section>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-10 flex flex-col justify-center">
          <h2 className="text-center text-4xl font-semibold text-slate-800">Sign in your account</h2>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleLinkedIn}
              disabled={!hasLinkedIn || loading}
              className="h-12 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </button>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={!hasGoogle || loading}
              className="h-12 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <GoogleMark />
              Google
            </button>

            <button
              type="button"
              onClick={handleFacebook}
              disabled={!hasFacebook || loading}
              className="h-12 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </button>
          </div>

          <p className="mt-8 text-center text-slate-400">or use your email</p>

          <form onSubmit={handleEmail} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email"
              required
              className="h-14 w-full rounded-lg border border-slate-300 px-4 text-lg outline-none focus:border-slate-400"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-14 w-full rounded-lg border border-slate-300 px-4 text-lg outline-none focus:border-slate-400"
            />
            <p className="text-xs text-slate-500 px-1">
              Use password for root/admin access. Leave password empty to receive magic link.
            </p>

            <button
              type="submit"
              disabled={loading || (!password.trim() && !hasEmail)}
              className="mt-2 h-14 w-full rounded-lg bg-emerald-500 text-white text-3xl font-semibold hover:bg-emerald-600 disabled:opacity-60"
            >
              Sign In
            </button>
          </form>

          <div className="mt-10 text-center space-y-2">
            {emailSent && (
              <p className="text-sm text-emerald-600">Magic link sent. Check your email.</p>
            )}
            {authError && (
              <p className="text-sm text-red-600">{authError}</p>
            )}
            {!hasEmail && (
              <p className="text-sm text-amber-700">Configure `RESEND_API_KEY` + `EMAIL_FROM` to enable email sign-in.</p>
            )}
            {(!hasGoogle || !hasLinkedIn || !hasFacebook) && (
              <p className="text-sm text-slate-500">
                To enable social login, configure provider keys in environment variables.
              </p>
            )}
            <p>
              <Link href="/login" className="text-indigo-600 font-semibold">Forgot your password?</Link>
            </p>
            <p className="text-slate-600">
              First time here? <Link href="/login" className="text-indigo-600 font-semibold">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
