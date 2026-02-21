#!/usr/bin/env node
/* eslint-disable no-console */
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const QA_TEST_PASSWORD = process.env.QA_TEST_PASSWORD;
const HEADLESS = process.env.E2E_HEADLESS === "1";
const RUN_SEED = process.argv.includes("--seed");

const ARTIFACT_DIR = path.join(
  ROOT_DIR,
  "tests",
  "artifacts",
  `synthetic-capabilities-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const ACCOUNTS = [
  { email: "qa-free@resumeai.local", expectedPlan: "free", templateId: "modern-professional" },
  { email: "qa-pro@resumeai.local", expectedPlan: "pro", templateId: "consultant-template" },
  { email: "qa-premium@resumeai.local", expectedPlan: "premium", templateId: "boardroom-template" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT_DIR, env: process.env, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function maybeSeed() {
  if (!RUN_SEED) return;
  await runCommand("npm", ["run", "db:seed:test-users"]);
  await runCommand("npm", ["run", "db:seed:synthetic"]);
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error(
      "Playwright no esta instalado. Ejecuta: npm i -D playwright && npx playwright install chromium"
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
  const typed = await emailInput.inputValue();
  assert(typed.trim().toLowerCase() === email.toLowerCase(), `Email no tipeado correctamente: ${typed}`);

  await passwordInput.fill("");
  await passwordInput.type(password, { delay: 20 });

  const signInButton = page.getByRole("button", { name: "Sign In" });
  await page.waitForFunction(
    () => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Sign In"
      );
      return Boolean(btn && !btn.hasAttribute("disabled"));
    },
    { timeout: 15000 }
  );
  await signInButton.click();
  await page.waitForURL(/\/dashboard|\/api\/auth\/signin/, {
    timeout: 60000,
    waitUntil: "domcontentloaded",
  });
  if (!page.url().includes("/dashboard")) {
    const authError = await page.locator("p.text-red-600").first().textContent().catch(() => null);
    throw new Error(`Login fallo para ${email}. authError=${authError || "n/a"}`);
  }
}

function buildResumePayload(account) {
  const now = Date.now();
  return {
    templateId: account.templateId,
    jobDescription:
      "We are looking for a software engineer with strong TypeScript, React, and Node.js experience. Must have CI/CD and cloud deployment exposure.",
    jobUrl: "https://jobs.synthetic.local/fullstack-engineer",
    personalInfo: {
      name: `Synthetic ${account.expectedPlan} User`,
      email: account.email,
      phone: "+1 555 999 1234",
      location: "Miami, FL",
      linkedin: "linkedin.com/in/synthetic-user",
      portfolio: "synthetic.dev",
      headline: "Senior Full-Stack Engineer",
    },
    experiences: [
      {
        title: "Senior Engineer",
        company: "Synthetic Labs",
        location: "Remote",
        startDate: "2022-01",
        endDate: "",
        current: true,
        description: "Built APIs, improved performance, and shipped product features.",
      },
      {
        title: "Engineer",
        company: "Automation Corp",
        location: "Remote",
        startDate: "2019-01",
        endDate: "2021-12",
        current: false,
        description: "Implemented frontend modules and backend services.",
      },
    ],
    education: [
      {
        degree: "BSc Computer Science",
        institution: "FIU",
        location: "Miami",
        graduationDate: "2018-05",
      },
    ],
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "CI/CD"],
  };
}

async function tryJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function runFlow(browser, account) {
  const result = {
    account: account.email,
    plan: account.expectedPlan,
    ok: false,
    steps: [],
    error: null,
  };

  const context = await browser.newContext();
  const page = await context.newPage();

  const record = (name, ok, details = "") => result.steps.push({ name, ok, details });

  try {
    await login(page, account.email, QA_TEST_PASSWORD);
    record("login", true);

    const profileRes = await context.request.get(`${BASE_URL}/api/profile`);
    const profileBody = await tryJson(profileRes);
    assert(profileRes.ok(), `GET /api/profile fallo (${profileRes.status()})`);
    assert(
      profileBody.planType === account.expectedPlan,
      `Plan inesperado: ${profileBody.planType} (esperado ${account.expectedPlan})`
    );
    record("profile", true, `plan=${profileBody.planType}`);

    const dashboardRes = await context.request.get(`${BASE_URL}/api/dashboard`);
    assert(dashboardRes.ok(), `GET /api/dashboard fallo (${dashboardRes.status()})`);
    record("dashboard", true);

    const templateRes = await context.request.get(`${BASE_URL}/api/template-access`);
    const templateBody = await tryJson(templateRes);
    assert(templateRes.ok(), `GET /api/template-access fallo (${templateRes.status()})`);
    assert(Array.isArray(templateBody.allowedTemplateIds), "template-access sin allowedTemplateIds");
    record("template-access", true, `allowed=${templateBody.allowedTemplateIds.length}`);

    const trackerRes = await context.request.post(`${BASE_URL}/api/tracker`, {
      data: {
        company: `SYNTH ${account.expectedPlan.toUpperCase()} Co`,
        position: "Automation QA",
        location: "Remote",
        status: "applied",
        priority: "medium",
        notes: `Automation tracker record for ${account.expectedPlan}`,
      },
    });
    assert(trackerRes.ok(), `POST /api/tracker fallo (${trackerRes.status()})`);
    record("tracker-create", true);

    const generateRes = await context.request.post(`${BASE_URL}/api/generate/resume`, {
      data: buildResumePayload(account),
    });
    const generateBody = await tryJson(generateRes);
    assert(
      generateRes.ok() && generateBody.resumeId,
      `POST /api/generate/resume fallo (${generateRes.status()}): ${JSON.stringify(generateBody)}`
    );
    const resumeId = generateBody.resumeId;
    record("resume-generate", true, `resumeId=${resumeId}`);

    const resumeRes = await context.request.get(`${BASE_URL}/api/resume/${resumeId}`);
    const resumeBody = await tryJson(resumeRes);
    assert(resumeRes.ok(), `GET /api/resume/${resumeId} fallo (${resumeRes.status()})`);
    record("resume-fetch", true);

    const atsRes = await context.request.post(`${BASE_URL}/api/resume/${resumeId}/ats-scan`, {
      data: { content: resumeBody.content },
    });
    const atsBody = await tryJson(atsRes);
    assert(atsRes.ok(), `POST ATS scan fallo (${atsRes.status()}): ${JSON.stringify(atsBody)}`);
    record("ats-scan", true, `score=${atsBody?.result?.score ?? "n/a"}`);

    const coverRes = await context.request.post(`${BASE_URL}/api/cover-letter`, {
      data: {
        resumeId,
        company: "Synthetic Target Co",
        position: "Senior Engineer",
      },
    });
    const coverBody = await tryJson(coverRes);
    if (account.expectedPlan === "free") {
      assert(
        coverRes.status() === 403,
        `Free plan debio bloquear cover letter. status=${coverRes.status()} body=${JSON.stringify(coverBody)}`
      );
      record("cover-letter-blocked-free", true);
    } else {
      assert(
        coverRes.ok() && coverBody?.letter?.id,
        `Cover letter fallo (${coverRes.status()}): ${JSON.stringify(coverBody)}`
      );
      record("cover-letter-create", true, `letterId=${coverBody.letter.id}`);
    }

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${account.expectedPlan}-dashboard.png`),
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
  if (!QA_TEST_PASSWORD) {
    throw new Error("Falta QA_TEST_PASSWORD en el entorno.");
  }

  await maybeSeed();
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: HEADLESS });

  try {
    const results = await Promise.all(ACCOUNTS.map((a) => runFlow(browser, a)));
    const okCount = results.filter((r) => r.ok).length;

    await writeFile(
      path.join(ARTIFACT_DIR, "summary.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: BASE_URL,
          headless: HEADLESS,
          results,
        },
        null,
        2
      ),
      "utf8"
    );

    console.log(`[synthetic-capabilities] ${okCount}/${results.length} flows passed.`);
    for (const r of results) {
      console.log(`${r.ok ? "[OK]" : "[FAIL]"} ${r.account} (${r.plan})`);
      if (r.error) console.log(`  error: ${r.error}`);
    }
    console.log(`[synthetic-capabilities] artifacts: ${ARTIFACT_DIR}`);
    if (okCount !== results.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[synthetic-capabilities] failed:", error.message);
  process.exit(1);
});
