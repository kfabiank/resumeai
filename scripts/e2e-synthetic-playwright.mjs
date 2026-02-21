#!/usr/bin/env node
/* eslint-disable no-console */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const QA_TEST_PASSWORD = process.env.QA_TEST_PASSWORD;
const HEADLESS = process.env.E2E_HEADLESS === "1";
const RUN_SEED = process.argv.includes("--seed");
const OPEN_CHECKOUT_PAGE = process.env.E2E_OPEN_CHECKOUT === "1";
const ARTIFACT_DIR = path.join(
  ROOT_DIR,
  "tests",
  "artifacts",
  `synthetic-e2e-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const ACCOUNTS = [
  { plan: "free", email: "qa-free@resumeai.local" },
  { plan: "pro", email: "qa-pro@resumeai.local" },
  { plan: "premium", email: "qa-premium@resumeai.local" },
];

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function maybeSeed() {
  if (!RUN_SEED) return;
  console.log("[seed] creating QA users...");
  await runCommand("npm", ["run", "db:seed:test-users"]);
  console.log("[seed] creating synthetic data...");
  await runCommand("npm", ["run", "db:seed:synthetic"]);
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error(
      'Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium'
    );
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  const emailInput = page.getByPlaceholder("you@example.com");
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.click();
  await emailInput.fill("");
  await emailInput.type(email, { delay: 20 });

  const typedEmail = await emailInput.inputValue();
  if (typedEmail.trim().toLowerCase() !== email.toLowerCase()) {
    throw new Error(`Could not type email correctly. Expected ${email}, got ${typedEmail}`);
  }

  const passwordInput = page.getByPlaceholder(/Optional \(leave empty for magic link\)/i);
  await passwordInput.fill("");
  await passwordInput.type(password, { delay: 20 });

  const signInButton = page.getByRole("button", { name: "Sign In" });
  await signInButton.waitFor({ state: "visible", timeout: 15000 });
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
  await page.waitForURL(/\/dashboard|\/api\/auth\/signin/, { timeout: 20000 });
  const current = page.url();
  if (current.includes("/api/auth/signin")) {
    throw new Error(`Credentials login failed for ${email}. Check QA_TEST_PASSWORD.`);
  }
}

async function createSyntheticProfile(context, account) {
  const profileRes = await context.request.get(`${BASE_URL}/api/profile`);
  assert(profileRes.ok(), `GET /api/profile failed for ${account.email}`);
  const profile = await profileRes.json();

  const patchRes = await context.request.patch(`${BASE_URL}/api/profile`, {
    data: {
      ...profile,
      name: profile.name || `SYNTH ${account.plan.toUpperCase()} USER`,
      headline: `Synthetic ${account.plan} test run`,
      summary: `Automated E2E synthetic summary for ${account.plan} plan.`,
      location: "Miami, FL",
    },
  });
  assert(patchRes.ok(), `PATCH /api/profile failed for ${account.email}`);
}

async function createSyntheticApplication(context, account) {
  const ts = Date.now();
  const payload = {
    company: `SYNTH ${account.plan.toUpperCase()} Co ${ts}`,
    position: `Automation QA ${account.plan.toUpperCase()}`,
    location: "Remote",
    status: "applied",
    priority: "medium",
    appliedDate: new Date().toISOString(),
    notes: `Synthetic E2E application for ${account.plan} account`,
  };
  const res = await context.request.post(`${BASE_URL}/api/tracker`, { data: payload });
  assert(
    res.ok(),
    `POST /api/tracker failed for ${account.email}: ${res.status()} ${await res.text()}`
  );
}

async function createFakeCheckoutSession(context, account) {
  if (account.plan !== "free") return { attempted: false };

  const plansRes = await context.request.get(`${BASE_URL}/api/stripe/plans`);
  if (!plansRes.ok()) {
    return { attempted: true, ok: false, reason: `plans endpoint failed (${plansRes.status()})` };
  }

  const plansBody = await plansRes.json();
  const proMonthly = (plansBody.plans || []).find(
    (p) => p.plan === "pro" && p.billingPeriod === "monthly"
  );
  if (!proMonthly?.priceId) {
    return { attempted: true, ok: false, reason: "missing Stripe pro monthly priceId" };
  }

  const checkoutRes = await context.request.post(`${BASE_URL}/api/stripe/checkout`, {
    data: { priceId: proMonthly.priceId },
  });

  if (!checkoutRes.ok()) {
    return { attempted: true, ok: false, reason: `checkout failed (${checkoutRes.status()})` };
  }

  const checkoutBody = await checkoutRes.json();
  const checkoutUrl = checkoutBody.url || "";
  if (OPEN_CHECKOUT_PAGE && checkoutUrl) {
    const page = await context.newPage();
    await page.goto(checkoutUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await page.close();
  }

  return { attempted: true, ok: Boolean(checkoutUrl), checkoutUrl };
}

async function runAccountFlow(browser, account) {
  const result = {
    account: account.email,
    plan: account.plan,
    ok: false,
    checkout: null,
    error: null,
  };

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page, account.email, QA_TEST_PASSWORD);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.goto(`${BASE_URL}/templates`, { waitUntil: "domcontentloaded" });
    await page.goto(`${BASE_URL}/tracker`, { waitUntil: "domcontentloaded" });
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: "domcontentloaded" });

    await createSyntheticProfile(context, account);
    await createSyntheticApplication(context, account);
    result.checkout = await createFakeCheckoutSession(context, account);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${account.plan}-dashboard.png`), fullPage: true });
    result.ok = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${account.plan}-error.png`), fullPage: true });
  } finally {
    await context.close();
  }

  return result;
}

async function main() {
  if (!QA_TEST_PASSWORD) {
    throw new Error("Missing QA_TEST_PASSWORD in environment.");
  }

  await maybeSeed();
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: HEADLESS });

  try {
    const startedAt = new Date().toISOString();
    const runs = await Promise.all(ACCOUNTS.map((account) => runAccountFlow(browser, account)));
    const summary = {
      startedAt,
      endedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      headless: HEADLESS,
      checkoutMode: OPEN_CHECKOUT_PAGE ? "open-checkout-page" : "api-only",
      runs,
    };

    await writeFile(
      path.join(ARTIFACT_DIR, "summary.json"),
      JSON.stringify(summary, null, 2),
      "utf-8"
    );

    const successCount = runs.filter((r) => r.ok).length;
    console.log(`[synthetic-e2e] ${successCount}/${runs.length} account flows passed.`);
    for (const run of runs) {
      const status = run.ok ? "OK" : "FAIL";
      console.log(
        `[${status}] ${run.account} (${run.plan})` +
          (run.checkout?.attempted ? ` | checkout: ${run.checkout.ok ? "ok" : run.checkout.reason}` : "")
      );
      if (run.error) console.log(`  error: ${run.error}`);
    }
    console.log(`[synthetic-e2e] artifacts: ${ARTIFACT_DIR}`);

    if (successCount !== runs.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[synthetic-e2e] failed:", error.message);
  process.exit(1);
});
