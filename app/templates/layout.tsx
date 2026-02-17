import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Templates",
  description:
    "Browse ATS-friendly resume templates by category. Preview and choose the best resume design for your role.",
  alternates: {
    canonical: "/templates",
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
