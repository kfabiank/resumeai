#!/usr/bin/env node
/* eslint-disable no-console */
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const QA_TEST_PASSWORD = process.env.QA_TEST_PASSWORD;
const HEADLESS = process.env.E2E_HEADLESS === "1";
const ARTIFACT_DIR = path.join(
  ROOT_DIR,
  "tests",
  "artifacts",
  `premium-ai-gating-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const ACCOUNTS = [
  { email: "qa-free@resumeai.local", expectedPlan: "free", expectAccess: false },
  { email: "qa-pro@resumeai.local", expectedPlan: "pro", expectAccess: false },
  { email: "qa-premium@resumeai.local", expectedPlan: "premium", expectAccess: true },
];

const FEATURES = [
  "resume_rewrite_pro",
  "job_match_scoring",
  "interview_simulation",
  "salary_negotiation_scripts",
  "advanced_ats_strategy",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error(
      "Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium"
    );
  }
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  const emailInput = page.getByPlaceholder("you@example.com");
  const passwordInput = page.getByPlaceholder(/Optional \(leave empty for magic link\)/i);
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill("");
  await emailInput.type(email, { delay: 20 });
  await passwordInput.fill("");
  await passwordInput.type(password, { delay: 20 });
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard|\/api\/auth\/signin/, { timeout: 60000 });
  if (!page.url().includes("/dashboard")) {
    throw new Error(`Login failed for ${email}`);
  }
}

function buildResumePayload(plan, email) {
  return {
    templateId: "modern-professional",
    jobDescription:
      "Senior product engineer role requiring TypeScript, React, experimentation, analytics, and stakeholder communication.",
    personalInfo: {
      name: `Premium AI ${plan} User`,
      email,
      phone: "+1 555 100 1000",
      location: "Miami, FL",
      headline: "Senior Product Engineer",
    },
    experiences: [
      {
        title: "Senior Product Engineer",
        company: "Northstar Labs",
        location: "Remote",
        startDate: "2022-01",
        endDate: "",
        current: true,
        description:
          "Built experimentation systems and improved conversion metrics across onboarding and activation.",
      },
    ],
    education: [
      {
        degree: "B.S. Computer Science",
        institution: "FIU",
        location: "Miami",
        graduationDate: "2019-05",
      },
    ],
    skills: ["TypeScript", "React", "Analytics", "Experimentation"],
  };
}

async function runAccountFlow(browser, account) {
  const result = {
    email: account.email,
    expectedPlan: account.expectedPlan,
    ok: false,
    checks: [],
    error: null,
  };
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page, account.email, QA_TEST_PASSWORD);

    const profileRes = await context.request.get(`${BASE_URL}/api/profile`);
    const profile = await profileRes.json();
    assert(profileRes.ok(), `profile failed ${profileRes.status()}`);
    assert(
      profile.planType === account.expectedPlan,
      `plan mismatch ${profile.planType} != ${account.expectedPlan}`
    );

    const createRes = await context.request.post(`${BASE_URL}/api/generate/resume`, {
      data: buildResumePayload(account.expectedPlan, account.email),
    });
    const createBody = await createRes.json().catch(() => ({}));
    assert(createRes.ok() && createBody.resumeId, `resume create failed ${createRes.status()}`);
    const resumeId = createBody.resumeId;

    const resumeRes = await context.request.get(`${BASE_URL}/api/resume/${resumeId}`);
    const resumeBody = await resumeRes.json();
    assert(resumeRes.ok(), `resume fetch failed ${resumeRes.status()}`);

    for (const feature of FEATURES) {
      const featureRes = await context.request.post(`${BASE_URL}/api/resume/${resumeId}/premium-ai`, {
        data: {
          feature,
          content: resumeBody.content,
          jobDescription: resumeBody.jobDescription || "",
          targetRole: resumeBody.jobTitle || "Senior Product Engineer",
        },
      });
      const featureBody = await featureRes.json().catch(() => ({}));
      const pass = account.expectAccess ? featureRes.ok() : featureRes.status() === 403;
      result.checks.push({
        feature,
        status: featureRes.status(),
        pass,
        message: featureBody?.message || featureBody?.error || "",
      });
      assert(
        pass,
        `${feature} unexpected status=${featureRes.status()} body=${JSON.stringify(featureBody)}`
      );
    }

    await page.goto(`${BASE_URL}/builder/${createBody.resumeId}`, { waitUntil: "domcontentloaded" });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${account.expectedPlan}-builder.png`),
      fullPage: true,
    });

    result.ok = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${account.expectedPlan}-error.png`),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
  return result;
}

async function main() {
  if (!QA_TEST_PASSWORD) throw new Error("Missing QA_TEST_PASSWORD in environment.");
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: HEADLESS });

  try {
    const runs = await Promise.all(ACCOUNTS.map((account) => runAccountFlow(browser, account)));
    const passed = runs.filter((run) => run.ok).length;
    await writeFile(
      path.join(ARTIFACT_DIR, "summary.json"),
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          startedAt: new Date().toISOString(),
          runs,
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`[premium-ai-gating] ${passed}/${runs.length} flows passed.`);
    for (const run of runs) {
      console.log(`[${run.ok ? "OK" : "FAIL"}] ${run.email} (${run.expectedPlan})`);
      if (run.error) console.log(`  error: ${run.error}`);
    }
    console.log(`[premium-ai-gating] artifacts: ${ARTIFACT_DIR}`);
    if (passed !== runs.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[premium-ai-gating] failed:", error.message);
  process.exit(1);
});

