#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULTS = {
  usersPerPlan: 3,
  resumesFree: 2,
  resumesPro: 4,
  resumesPremium: 6,
  appsPerUser: 8,
  emailPrefix: 'synthetic',
  emailDomain: 'synthetic.resumeai.local',
  tag: 'SYNTH',
};

const TEMPLATE_SEEDS = [
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Synthetic seed template',
    category: 'professional',
    isPremium: false,
  },
  {
    id: 'tech-minimal',
    name: 'Tech Minimal',
    description: 'Synthetic seed template',
    category: 'tech',
    isPremium: false,
  },
  {
    id: 'simple-clean',
    name: 'Simple Clean',
    description: 'Synthetic seed template',
    category: 'modern',
    isPremium: false,
  },
  {
    id: 'executive-classic',
    name: 'Executive Classic',
    description: 'Synthetic seed template',
    category: 'executive',
    isPremium: true,
  },
  {
    id: 'consultant-pro',
    name: 'Consultant Pro',
    description: 'Synthetic seed template',
    category: 'professional',
    isPremium: true,
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    description: 'Synthetic seed template',
    category: 'creative',
    isPremium: true,
  },
];

const JOB_TITLES = [
  'Software Engineer',
  'Senior Frontend Engineer',
  'Product Manager',
  'Data Analyst',
  'DevOps Engineer',
  'Marketing Manager',
  'QA Engineer',
  'Technical Program Manager',
];

const COMPANIES = [
  'Acme Labs',
  'Northstar Systems',
  'Pixel Forge',
  'Atlas Cloud',
  'BluePeak Analytics',
  'Summit Commerce',
  'Velocity Health',
  'Orion Security',
];

function envInt(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildResumeContent(fullName, email, idx) {
  const title = JOB_TITLES[idx % JOB_TITLES.length];
  const company = COMPANIES[idx % COMPANIES.length];
  const year = 2021 + (idx % 3);

  return {
    personalInfo: {
      name: fullName,
      email,
      phone: '+1 (555) 100-2000',
      location: 'United States',
      linkedin: 'https://linkedin.com/in/synthetic-user',
      portfolio: 'https://portfolio.synthetic.local',
      headline: title,
    },
    professionalSummary:
      'Results-driven professional with proven delivery in cross-functional teams. Strong experience improving reliability, speed, and customer outcomes with measurable business impact.',
    experiences: [
      {
        title,
        company,
        location: 'Remote',
        startDate: `${year}-01`,
        endDate: `${year + 1}-12`,
        current: false,
        optimizedBullets: [
          'Delivered platform improvements that reduced incident volume by 35%.',
          'Led migration initiatives and improved release frequency by 2x.',
          'Partnered with product and design to launch features used by 50k+ users.',
        ],
        keywordsUsed: ['leadership', 'scalability', 'automation', 'performance'],
      },
      {
        title: `Associate ${title}`,
        company: `Previous ${company}`,
        location: 'Remote',
        startDate: `${year - 2}-01`,
        endDate: `${year - 1}-12`,
        current: false,
        optimizedBullets: [
          'Built internal tooling that saved 12 engineering hours weekly.',
          'Improved test reliability and reduced flaky failures by 40%.',
          'Documented architecture standards and onboarding playbooks.',
        ],
        keywordsUsed: ['quality', 'documentation', 'process'],
      },
    ],
    education: [
      {
        degree: 'B.S. Computer Science',
        institution: 'State University',
        location: 'United States',
        graduationDate: '2020-05',
        gpa: '3.8',
      },
    ],
    skills: {
      technical: [
        'TypeScript',
        'React',
        'Next.js',
        'Node.js',
        'PostgreSQL',
        'Prisma',
        'CI/CD',
        'AWS',
      ],
      soft: ['Communication', 'Ownership', 'Problem Solving', 'Leadership'],
    },
    keywords: [
      'typescript',
      'react',
      'next.js',
      'node.js',
      'postgresql',
      'automation',
      'scalability',
      'ci/cd',
      'leadership',
      'testing',
      'performance',
      'delivery',
    ],
  };
}

function randomAts() {
  return 68 + Math.floor(Math.random() * 28);
}

async function ensureTemplates() {
  for (const template of TEMPLATE_SEEDS) {
    await prisma.template.upsert({
      where: { id: template.id },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        isPremium: template.isPremium,
        isActive: true,
      },
      create: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        thumbnail: '',
        htmlStructure: `<div>${template.name}</div>`,
        cssStyles: '',
        colorScheme: { gradient: 'from-blue-500 to-blue-700' },
        isPremium: template.isPremium,
        isActive: true,
      },
    });
  }
}

async function run() {
  const usersPerPlan = envInt('SYNTHETIC_USERS_PER_PLAN', DEFAULTS.usersPerPlan);
  const resumesFree = envInt('SYNTHETIC_RESUMES_FREE', DEFAULTS.resumesFree);
  const resumesPro = envInt('SYNTHETIC_RESUMES_PRO', DEFAULTS.resumesPro);
  const resumesPremium = envInt('SYNTHETIC_RESUMES_PREMIUM', DEFAULTS.resumesPremium);
  const appsPerUser = envInt('SYNTHETIC_APPS_PER_USER', DEFAULTS.appsPerUser);
  const emailPrefix = process.env.SYNTHETIC_EMAIL_PREFIX || DEFAULTS.emailPrefix;
  const emailDomain = process.env.SYNTHETIC_EMAIL_DOMAIN || DEFAULTS.emailDomain;
  const tag = process.env.SYNTHETIC_TAG || DEFAULTS.tag;

  await ensureTemplates();

  const plans = ['free', 'pro', 'premium'];
  let createdUsers = 0;
  let createdResumes = 0;
  let createdApplications = 0;

  for (const plan of plans) {
    for (let i = 1; i <= usersPerPlan; i += 1) {
      const email = `${emailPrefix}-${plan}-${i}@${emailDomain}`.toLowerCase();
      const name = `${tag} ${plan.toUpperCase()} User ${i}`;

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name,
          planType: plan,
          emailVerified: new Date(),
          subscriptionStatus: plan === 'free' ? null : 'active',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd:
            plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        create: {
          email,
          name,
          planType: plan,
          emailVerified: new Date(),
          subscriptionStatus: plan === 'free' ? null : 'active',
          currentPeriodEnd:
            plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          phone: '+1 (555) 100-2000',
          location: 'United States',
          headline: `${plan.toUpperCase()} Synthetic Profile`,
          summary: 'Synthetic profile used for local QA and automation.',
          linkedinUrl: 'https://linkedin.com/in/synthetic-user',
          portfolioUrl: 'https://portfolio.synthetic.local',
          githubUrl: 'https://github.com/synthetic-user',
          experiences: [],
          education: [],
          skills: [],
          languages: [],
          certifications: [],
        },
        create: {
          userId: user.id,
          phone: '+1 (555) 100-2000',
          location: 'United States',
          headline: `${plan.toUpperCase()} Synthetic Profile`,
          summary: 'Synthetic profile used for local QA and automation.',
          linkedinUrl: 'https://linkedin.com/in/synthetic-user',
          portfolioUrl: 'https://portfolio.synthetic.local',
          githubUrl: 'https://github.com/synthetic-user',
          experiences: [],
          education: [],
          skills: [],
          languages: [],
          certifications: [],
        },
      });

      await prisma.resume.deleteMany({ where: { userId: user.id } });
      await prisma.jobApplication.deleteMany({ where: { userId: user.id } });
      await prisma.coverLetter.deleteMany({ where: { userId: user.id } });
      await prisma.usageLog.deleteMany({ where: { userId: user.id } });

      const resumeCount = plan === 'free' ? resumesFree : plan === 'pro' ? resumesPro : resumesPremium;
      const templatePool =
        plan === 'free'
          ? ['modern-professional', 'tech-minimal', 'simple-clean']
          : ['modern-professional', 'executive-classic', 'consultant-pro', 'creative-bold'];

      for (let r = 0; r < resumeCount; r += 1) {
        const content = buildResumeContent(name, email, r);
        const atsScore = randomAts();

        await prisma.resume.create({
          data: {
            userId: user.id,
            title: `${content.personalInfo.headline} - Synthetic ${r + 1}`,
            jobTitle: content.personalInfo.headline,
            jobDescription:
              'We are looking for a collaborative and technically strong professional with experience in modern tooling and measurable outcomes.',
            jobUrl: 'https://jobs.synthetic.local/example-role',
            content,
            templateId: templatePool[r % templatePool.length],
            atsScore,
            atsFeedback: {
              score: atsScore,
              source: 'synthetic-seed',
            },
          },
        });
        createdResumes += 1;
      }

      const now = new Date();
      for (let a = 0; a < appsPerUser; a += 1) {
        const appliedDate = new Date(now);
        appliedDate.setDate(now.getDate() - a * 2);

        const interviewDate =
          a % 3 === 0 ? new Date(now.getTime() + (a + 1) * 24 * 60 * 60 * 1000) : null;
        const followUpDate =
          a % 2 === 0 ? new Date(now.getTime() + (a + 2) * 24 * 60 * 60 * 1000) : null;

        await prisma.jobApplication.create({
          data: {
            userId: user.id,
            company: COMPANIES[a % COMPANIES.length],
            position: JOB_TITLES[a % JOB_TITLES.length],
            location: 'Remote',
            jobUrl: `https://jobs.synthetic.local/${plan}/${a + 1}`,
            salary: '$120,000 - $150,000',
            status: ['applied', 'phone_screen', 'interview', 'offer'][a % 4],
            priority: ['low', 'medium', 'high'][a % 3],
            appliedDate,
            interviewDate,
            followUpDate,
            notes: `${tag} synthetic application record`,
            contacts: [
              {
                name: 'Taylor Recruiter',
                role: 'Recruiter',
                email: 'taylor.recruiter@synthetic.local',
              },
            ],
          },
        });
        createdApplications += 1;
      }

      await prisma.usageLog.createMany({
        data: [
          {
            userId: user.id,
            actionType: 'resume_created',
            metadata: { source: 'synthetic-seed' },
          },
          {
            userId: user.id,
            actionType: 'resume_exported',
            metadata: { source: 'synthetic-seed' },
          },
        ],
      });

      createdUsers += 1;
    }
  }

  console.log('Synthetic data seeded successfully.');
  console.log(`Users: ${createdUsers}`);
  console.log(`Resumes: ${createdResumes}`);
  console.log(`Applications: ${createdApplications}`);
  console.log(`Email pattern: ${emailPrefix}-{plan}-{n}@${emailDomain}`);
}

run()
  .catch((error) => {
    console.error('Failed to seed synthetic data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
