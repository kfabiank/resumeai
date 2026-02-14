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

      if (!email || !password || !rootAdminEmail || !rootAdminPassword) {
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.email?.toLowerCase() === rootAdminEmail ? 'admin' : 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }

      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
