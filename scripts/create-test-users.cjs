#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: 'qa-free@resumeai.local',
    name: 'QA Free User',
    planType: 'free',
    subscriptionStatus: null,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    currentPeriodEnd: null,
  },
  {
    email: 'qa-pro@resumeai.local',
    name: 'QA Pro User',
    planType: 'pro',
    subscriptionStatus: 'active',
    stripeSubscriptionId: 'sub_test_pro_active',
    stripeCustomerId: 'cus_test_pro_active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    email: 'qa-premium@resumeai.local',
    name: 'QA Premium User',
    planType: 'premium',
    subscriptionStatus: 'active',
    stripeSubscriptionId: 'sub_test_premium_active',
    stripeCustomerId: 'cus_test_premium_active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
];

async function run() {
  for (const user of TEST_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        planType: user.planType,
        subscriptionStatus: user.subscriptionStatus,
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripeCustomerId: user.stripeCustomerId,
        currentPeriodEnd: user.currentPeriodEnd,
        emailVerified: new Date(),
      },
      create: {
        email: user.email,
        name: user.name,
        planType: user.planType,
        subscriptionStatus: user.subscriptionStatus,
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripeCustomerId: user.stripeCustomerId,
        currentPeriodEnd: user.currentPeriodEnd,
        emailVerified: new Date(),
      },
    });
  }

  console.log(`Created/updated ${TEST_USERS.length} test users.`);
  for (const user of TEST_USERS) {
    console.log(`- ${user.email} (${user.planType})`);
  }
}

run()
  .catch((error) => {
    console.error('Failed to seed test users:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
