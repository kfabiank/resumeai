#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULTS = {
  emailPrefix: 'synthetic',
  emailDomain: 'synthetic.resumeai.local',
  tag: 'SYNTH',
};

async function run() {
  const emailPrefix = process.env.SYNTHETIC_EMAIL_PREFIX || DEFAULTS.emailPrefix;
  const emailDomain = process.env.SYNTHETIC_EMAIL_DOMAIN || DEFAULTS.emailDomain;
  const tag = process.env.SYNTHETIC_TAG || DEFAULTS.tag;

  const syntheticUsers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: `${emailPrefix}-`,
        endsWith: `@${emailDomain}`,
      },
    },
    select: { id: true, email: true, name: true },
  });

  if (!syntheticUsers.length) {
    console.log('No synthetic users found. Nothing to reset.');
    return;
  }

  const userIds = syntheticUsers.map((u) => u.id);

  const [usageLogs, coverLetters, applications, resumes, sessions, accounts, profiles, users] =
    await prisma.$transaction([
      prisma.usageLog.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.coverLetter.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.jobApplication.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.resume.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.session.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.account.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.userProfile.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);

  console.log(`${tag} synthetic data removed.`);
  console.log(`Users removed: ${users.count}`);
  console.log(`Profiles removed: ${profiles.count}`);
  console.log(`Accounts removed: ${accounts.count}`);
  console.log(`Sessions removed: ${sessions.count}`);
  console.log(`Resumes removed: ${resumes.count}`);
  console.log(`Applications removed: ${applications.count}`);
  console.log(`Cover letters removed: ${coverLetters.count}`);
  console.log(`Usage logs removed: ${usageLogs.count}`);
}

run()
  .catch((error) => {
    console.error('Failed to reset synthetic data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
