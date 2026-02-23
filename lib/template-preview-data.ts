import type { ResumeData } from "@/types/resume";

export const TEMPLATE_PREVIEW_DATA: ResumeData = {
  personalInfo: {
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 555 123 4567",
    location: "San Francisco, CA",
    headline: "Principal Product Engineer",
    linkedin: "linkedin.com/in/johndoe",
    portfolio: "johndoe.dev",
  },
  professionalSummary:
    "Principal Product Engineer with 10+ years building high-growth SaaS platforms. Expert in React, TypeScript, Node.js, and cloud-native architecture with a strong track record scaling teams, systems, and revenue outcomes.",
  experiences: [
    {
      title: "Principal Product Engineer",
      company: "Northstar Labs",
      location: "San Francisco, CA",
      startDate: "2022-02",
      endDate: "",
      current: true,
      optimizedBullets: [
        "Led migration to a service-oriented architecture supporting 4.2M monthly active users with 99.98% uptime.",
        "Reduced p95 API latency by 47% by redesigning caching and query strategies across core endpoints.",
        "Partnered with product and growth to launch onboarding experiments that increased paid conversion by 29%.",
        "Mentored 8 engineers and introduced an RFC process that cut release regressions by 34%.",
      ],
      keywordsUsed: ["typescript", "microservices", "aws", "experimentation"],
    },
    {
      title: "Senior Software Engineer",
      company: "Apex Commerce",
      location: "Remote",
      startDate: "2019-06",
      endDate: "2022-01",
      current: false,
      optimizedBullets: [
        "Architected event-driven order workflows processing 18M+ transactions per year with strong observability.",
        "Built a multi-tenant analytics dashboard used by enterprise clients to monitor KPIs and SLAs in real time.",
        "Implemented CI/CD guardrails and canary releases reducing failed deployments by 61%.",
        "Collaborated with security to implement SSO and role-based access controls for regulated accounts.",
      ],
      keywordsUsed: ["react", "node.js", "postgresql", "ci/cd"],
    },
    {
      title: "Software Engineer",
      company: "LaunchForge",
      location: "Austin, TX",
      startDate: "2016-03",
      endDate: "2019-05",
      current: false,
      optimizedBullets: [
        "Delivered customer-facing features across web and API products used by 120k+ monthly users.",
        "Built internal tooling that reduced support resolution time from 2 days to under 4 hours.",
        "Created shared component library that accelerated feature delivery across 3 product squads.",
      ],
      keywordsUsed: ["frontend", "api", "automation"],
    },
  ],
  education: [
    {
      degree: "M.S. Software Engineering",
      institution: "University of Washington",
      location: "Seattle, WA",
      graduationDate: "2016-06",
      gpa: "3.9",
    },
    {
      degree: "B.S. Computer Science",
      institution: "University of California, Davis",
      location: "Davis, CA",
      graduationDate: "2014-06",
      gpa: "3.8",
    },
  ],
  skills: {
    technical: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "PostgreSQL",
      "Redis",
      "AWS",
      "Docker",
      "Kubernetes",
      "Terraform",
    ],
    soft: ["Leadership", "Cross-functional Communication", "Mentoring", "Strategic Planning"],
  },
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Professional" },
  ],
  keywords: ["SaaS", "Scalability", "Performance", "Microservices", "Experimentation"],
};
