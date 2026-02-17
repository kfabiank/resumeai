#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || "qa-free@resumeai.local").toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, planType: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });

  if (!user) {
    console.log(`User not found: ${email}`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: {
      planType: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      currentPeriodEnd: null,
    },
  });

  await prisma.usageLog.deleteMany({
    where: {
      userId: user.id,
      actionType: { in: ["plan_upgraded", "plan_downgraded"] },
    },
  });

  console.log("QA user reset completed:");
  console.log(`- email: ${email}`);
  console.log("- planType: free");
  console.log("- stripeCustomerId: null");
  console.log("- stripeSubscriptionId: null");
}

main()
  .catch((error) => {
    console.error("Failed to reset QA user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
