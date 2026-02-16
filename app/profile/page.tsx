'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import AppTopNav from '@/components/AppTopNav';

type ProfileData = {
  name: string;
  email: string;
  planType: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  linkedinUrl: string;
  portfolioUrl: string;
  githubUrl: string;
};

const EMPTY_PROFILE: ProfileData = {
  name: '',
  email: '',
  planType: 'free',
  phone: '',
  location: '',
  headline: '',
  summary: '',
  linkedinUrl: '',
  portfolioUrl: '',
  githubUrl: '',
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = useCallback(async (withLoading = false) => {
    if (withLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, ...data }));
    } catch {
      setError('Could not load profile');
    } finally {
      if (withLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile(true);
  }, [loadProfile]);

  const onChange =
    (field: keyof ProfileData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save profile');
        return;
      }
      setMessage('Profile updated successfully');
    } catch {
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const onImportLinkedIn = async () => {
    setError('');
    setMessage('');
    setIsImportingLinkedIn(true);
    try {
      const res = await fetch('/api/profile/import-linkedin', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not import LinkedIn profile');
        return;
      }
      await loadProfile();
      setMessage('LinkedIn profile imported successfully');
    } catch {
      setError('Could not import LinkedIn profile');
    } finally {
      setIsImportingLinkedIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopNav
        active="profile"
        userName={form.name || form.email?.split('@')[0] || 'User'}
        planType={form.planType || 'free'}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600 mb-8">
          Edit your personal details used across your resumes.
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onImportLinkedIn}
            disabled={isImportingLinkedIn}
            className="inline-flex items-center rounded-lg border border-[#0A66C2] px-4 py-2 text-sm font-medium text-[#0A66C2] hover:bg-blue-50 disabled:opacity-60"
          >
            {isImportingLinkedIn ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing from LinkedIn...
              </>
            ) : (
              'Import from LinkedIn'
            )}
          </button>
          <p className="text-sm text-gray-500">
            First sign in with LinkedIn at least once, then import your latest profile basics.
          </p>
        </div>

        <form onSubmit={onSave} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input value={form.name} onChange={onChange('name')} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={onChange('email')} required className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={onChange('phone')} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input value={form.location} onChange={onChange('location')} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input value={form.headline} onChange={onChange('headline')} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Professional summary</label>
            <textarea rows={4} value={form.summary} onChange={onChange('summary')} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input value={form.linkedinUrl} onChange={onChange('linkedinUrl')} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
              <input value={form.portfolioUrl} onChange={onChange('portfolioUrl')} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
              <input value={form.githubUrl} onChange={onChange('githubUrl')} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </button>
        </form>
      </main>
    </div>
  );
}
