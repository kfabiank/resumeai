import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || process.env.FROM_EMAIL;
const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase();
const rootAdminPassword = process.env.ROOT_ADMIN_PASSWORD;
const qaTestPassword = process.env.QA_TEST_PASSWORD;
const syntheticEmailPrefix = process.env.SYNTHETIC_EMAIL_PREFIX || 'synthetic';
const syntheticEmailDomain = process.env.SYNTHETIC_EMAIL_DOMAIN || 'synthetic.resumeai.local';
const qaTestEmails = new Set([
  'qa-free@resumeai.local',
  'qa-pro@resumeai.local',
  'qa-premium@resumeai.local',
]);

const providers: NextAuthOptions['providers'] = [];

providers.push(
  CredentialsProvider({
    name: 'Email and password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password;

      if (!email || !password) {
        return null;
      }

      // Development-only QA credentials login.
      if (
        process.env.NODE_ENV !== 'production' &&
        qaTestPassword &&
        qaTestEmails.has(email) &&
        password === qaTestPassword
      ) {
        const now = new Date();
        const qaPlanType = email.includes('qa-premium')
          ? 'premium'
          : email.includes('qa-pro')
          ? 'pro'
          : 'free';

        const qaUser = await prisma.user.upsert({
          where: { email },
          update: {
            name:
              qaPlanType === 'premium'
                ? 'QA Premium User'
                : qaPlanType === 'pro'
                ? 'QA Pro User'
                : 'QA Free User',
            planType: qaPlanType,
            emailVerified: now,
          },
          create: {
            email,
            name:
              qaPlanType === 'premium'
                ? 'QA Premium User'
                : qaPlanType === 'pro'
                ? 'QA Pro User'
                : 'QA Free User',
            planType: qaPlanType,
            emailVerified: now,
          },
        });

        return qaUser;
      }

      // Development-only synthetic users login.
      if (
        process.env.NODE_ENV !== 'production' &&
        qaTestPassword &&
        email.startsWith(`${syntheticEmailPrefix}-`) &&
        email.endsWith(`@${syntheticEmailDomain}`) &&
        password === qaTestPassword
      ) {
        const syntheticUser = await prisma.user.findUnique({
          where: { email },
        });

        if (syntheticUser) {
          return syntheticUser;
        }
      }

      if (!rootAdminEmail || !rootAdminPassword) {
        return null;
      }

      if (email !== rootAdminEmail || password !== rootAdminPassword) {
        return null;
      }

      const now = new Date();
      const user = await prisma.user.upsert({
        where: { email: rootAdminEmail },
        update: {
          name: 'Root Admin',
          planType: 'premium',
          emailVerified: now,
        },
        create: {
          email: rootAdminEmail,
          name: 'Root Admin',
          planType: 'premium',
          emailVerified: now,
        },
      });

      return user;
    },
  })
);

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    })
  );
}

if (linkedinClientId && linkedinClientSecret) {
  providers.push(
    LinkedInProvider({
      clientId: linkedinClientId,
      clientSecret: linkedinClientSecret,
    })
  );
}

if (facebookClientId && facebookClientSecret) {
  providers.push(
    FacebookProvider({
      clientId: facebookClientId,
      clientSecret: facebookClientSecret,
    })
  );
}

if (resendApiKey && emailFrom) {
  providers.push(
    EmailProvider({
      from: emailFrom,
      maxAge: 24 * 60 * 60,
      async sendVerificationRequest({ identifier, url, provider }) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to: identifier,
            subject: 'Sign in to ResumeAI',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
                <h2>Sign in to ResumeAI</h2>
                <p>Click the button below to securely sign in.</p>
                <p>
                  <a href="${url}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">
                    Sign in
                  </a>
                </p>
                <p style="font-size: 12px; color: #6b7280;">If you did not request this email, you can ignore it.</p>
              </div>
            `,
            text: `Sign in to ResumeAI: ${url}`,
          }),
        });

        if (!response.ok) {
          const details = await response.text();
          throw new Error(`Failed to send magic link email: ${details}`);
        }
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      const tokenSub = typeof token.sub === 'string' ? token.sub : undefined;

      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      } else if (tokenSub) {
        token.id = tokenSub;
      }

      // On OAuth sign-in, update DB user with provider profile data
      if (account?.provider === 'google' && profile) {
        const googleProfile = profile as { name?: string; email?: string; picture?: string };
        const userId = (token.id as string) || tokenSub;
        if (userId && googleProfile.email) {
          try {
            const updated = await prisma.user.update({
              where: { id: userId },
              data: {
                name: googleProfile.name || token.name as string,
                email: googleProfile.email,
                image: googleProfile.picture || null,
              },
            });
            token.name = updated.name;
            token.email = updated.email;
            token.picture = updated.image;
          } catch {
            // User might not exist yet; PrismaAdapter will create it
          }
        }
      }

      const tokenEmail = typeof token.email === 'string' ? token.email.toLowerCase() : '';
      token.role = tokenEmail && tokenEmail === rootAdminEmail ? 'admin' : 'user';
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = ((token.id as string | undefined) || (token.sub as string | undefined) || '') as string;
        session.user.role = token.role as string | undefined;
        // Keep session data in sync with token (which reflects DB/provider data)
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
      }

      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
