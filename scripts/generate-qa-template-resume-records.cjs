#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const fs = require("node:fs/promises");
const path = require("node:path");

const prisma = new PrismaClient();

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, "lib", "template-catalog.ts");
const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || "").toLowerCase().trim();

function parseTemplates(content) {
  const items = [];
  const blockRegex = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?category:\s*'([^']+)'/g;
  let match = blockRegex.exec(content);
  while (match) {
    items.push({ id: match[1], name: match[2], category: match[3] });
    match = blockRegex.exec(content);
  }
  return items;
}

function previewContent() {
  return {
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
        ],
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
}

async function main() {
  if (!ROOT_ADMIN_EMAIL) {
    throw new Error("Missing ROOT_ADMIN_EMAIL in environment.");
  }

  const catalogSource = await fs.readFile(CATALOG_PATH, "utf8");
  const templates = parseTemplates(catalogSource);
  if (!templates.length) throw new Error("No templates found in template-catalog.ts");

  const now = new Date();
  const admin = await prisma.user.upsert({
    where: { email: ROOT_ADMIN_EMAIL },
    update: {
      name: "Root Admin",
      planType: "premium",
      emailVerified: now,
    },
    create: {
      email: ROOT_ADMIN_EMAIL,
      name: "Root Admin",
      planType: "premium",
      emailVerified: now,
    },
  });

  const dbTemplates = await prisma.template.findMany({
    where: { id: { in: templates.map((t) => t.id) } },
    select: { id: true },
  });
  const available = new Set(dbTemplates.map((t) => t.id));
  const missing = templates.filter((t) => !available.has(t.id));

  if (missing.length) {
    console.log("Templates missing in DB (skipped):");
    for (const m of missing) console.log(`- ${m.id}`);
  }

  let created = 0;
  let updated = 0;
  for (const t of templates) {
    if (!available.has(t.id)) continue;
    const title = `QA Preview - ${t.name}`;
    const existing = await prisma.resume.findFirst({
      where: { userId: admin.id, templateId: t.id, title },
      select: { id: true },
    });

    if (existing) {
      await prisma.resume.update({
        where: { id: existing.id },
        data: {
          content: previewContent(),
          atsScore: 92,
          updatedAt: new Date(),
        },
      });
      updated += 1;
    } else {
      await prisma.resume.create({
        data: {
          userId: admin.id,
          title,
          jobTitle: "Principal Product Engineer",
          jobDescription:
            "QA design preview resume record generated for template visual verification.",
          templateId: t.id,
          content: previewContent(),
          atsScore: 92,
        },
      });
      created += 1;
    }
  }

  console.log(`QA template resume records ready for ${ROOT_ADMIN_EMAIL}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
}

main()
  .catch((error) => {
    console.error("Failed to generate QA template resume records:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
