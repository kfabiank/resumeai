'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, FileText } from 'lucide-react';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    void getProviders().then(setProviders);
  }, []);

  const hasGoogle = providers ? !!providers.google : true;
  const hasLinkedIn = providers ? !!providers.linkedin : true;
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
    if (providers && !providers.google) {
      setAuthError('Google provider is not configured.');
      return;
    }

    setLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  async function handleLinkedIn() {
    setAuthError('');
    if (providers && !providers.linkedin) {
      setAuthError('LinkedIn provider is not configured.');
      return;
    }

    setLoading(true);
    await signIn('linkedin', { callbackUrl: '/dashboard' });
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
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
          <FileText className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold text-blue-600">ResumeAI</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <h1 className="text-center text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-2 text-center text-gray-500">Sign in to continue building resumes</p>

        {/* OAuth Buttons */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || !hasGoogle}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleLinkedIn}
            disabled={loading || !hasLinkedIn}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <LinkedInMark />
            Continue with LinkedIn
          </button>
        </div>
        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">or continue with email</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleEmail} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!password.trim() && !hasEmail)}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            Sign In
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        {/* Messages */}
        <div className="mt-6 text-center space-y-2">
          {emailSent && (
            <p className="text-sm text-emerald-600">Magic link sent. Check your email.</p>
          )}
          {authError && (
            <p className="text-sm text-red-600">{authError}</p>
          )}
        </div>

        {/* Sign up link */}
        <p className="mt-6 text-center text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign Up
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-gray-400">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </main>
  );
}
