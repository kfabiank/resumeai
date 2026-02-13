import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResumeAI - AI-Powered Resume Builder | ATS-Optimized CVs in Minutes",
  description: "Create ATS-optimized resumes in minutes with AI. Get real-time ATS scores, job-specific optimization, and professional templates. Land your dream job faster with ResumeAI.",
  keywords: "resume builder, CV maker, ATS optimization, AI resume, job application, cover letter, career",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
