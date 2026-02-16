import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

type LinkedInUserInfo = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
  locale?: string;
  profile?: string;
  profile_url?: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  vanityName?: string;
  headline?: string;
};

function sanitize(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders });
  }

  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'linkedin',
    },
    select: {
      access_token: true,
    },
    orderBy: { id: 'desc' },
  });

  const accessToken = account?.access_token;
  if (!accessToken) {
    return NextResponse.json(
      {
        error: 'LinkedIn account not connected. Sign in with LinkedIn first.',
        code: 'LINKEDIN_NOT_CONNECTED',
      },
      { status: 400, headers: noStoreHeaders }
    );
  }

  let linkedInData: LinkedInUserInfo | null = null;

  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      linkedInData = (await res.json()) as LinkedInUserInfo;
    } else {
      return NextResponse.json(
        {
          error: 'Could not fetch LinkedIn profile. Reconnect LinkedIn and try again.',
          code: 'LINKEDIN_FETCH_FAILED',
        },
        { status: 400, headers: noStoreHeaders }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'LinkedIn request failed', code: 'LINKEDIN_REQUEST_FAILED' },
      { status: 502, headers: noStoreHeaders }
    );
  }

  const name =
    sanitize(linkedInData?.name) ||
    sanitize(
      [linkedInData?.given_name, linkedInData?.family_name]
        .filter(Boolean)
        .join(' ')
    ) ||
    sanitize(
      [linkedInData?.localizedFirstName, linkedInData?.localizedLastName]
        .filter(Boolean)
        .join(' ')
    );

  const email = sanitize(linkedInData?.email);
  const image = sanitize(linkedInData?.picture);
  const headline = sanitize(linkedInData?.headline);
  const linkedinUrl =
    sanitize(linkedInData?.profile_url) ||
    sanitize(linkedInData?.profile) ||
    (sanitize(linkedInData?.vanityName)
      ? `https://www.linkedin.com/in/${sanitize(linkedInData?.vanityName)}`
      : null);

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404, headers: noStoreHeaders });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email: email || currentUser.email,
        image,
      },
    });

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        headline,
        linkedinUrl,
      },
      create: {
        userId,
        phone: null,
        location: null,
        headline,
        summary: null,
        linkedinUrl,
        portfolioUrl: null,
        githubUrl: null,
        experiences: [],
        education: [],
        skills: [],
        languages: [],
        certifications: [],
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'LinkedIn email already used by another account', code: 'EMAIL_CONFLICT' },
        { status: 409, headers: noStoreHeaders }
      );
    }
    return NextResponse.json(
      { error: 'Failed to import LinkedIn profile' },
      { status: 500, headers: noStoreHeaders }
    );
  }

  return NextResponse.json(
    {
      success: true,
      imported: {
        name: name || '',
        email: email || currentUser.email,
        image: image || '',
        headline: headline || '',
        linkedinUrl: linkedinUrl || '',
      },
    },
    { headers: noStoreHeaders }
  );
}
