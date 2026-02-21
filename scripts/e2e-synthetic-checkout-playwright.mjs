#!/usr/bin/env node
/* eslint-disable no-console */
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const QA_TEST_PASSWORD = process.env.QA_TEST_PASSWORD;
const HEADLESS = process.env.E2E_HEADLESS === "1";
const prisma = new PrismaClient();

const ARTIFACT_DIR = path.join(
  ROOT_DIR,
  "tests",
  "artifacts",
  `synthetic-checkout-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const SCENARIOS = [
  { key: "pro-monthly", targetPlan: "pro", billingPeriod: "monthly" },
  { key: "premium-monthly", targetPlan: "premium", billingPeriod: "monthly" },
  { key: "pro-annual", targetPlan: "pro", billingPeriod: "annual" },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function bootstrapUsers() {
  const runId = Date.now();
  const users = [];
  for (const scenario of SCENARIOS) {
    const email = `synthetic-checkout-${scenario.key}-${runId}@synthetic.resumeai.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: `SYNTH CHECKOUT ${scenario.key}`,
        planType: "free",
        subscriptionStatus: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        emailVerified: new Date(),
      },
      create: {
        email,
        name: `SYNTH CHECKOUT ${scenario.key}`,
        planType: "free",
        subscriptionStatus: null,
        emailVerified: new Date(),
      },
    });
    users.push({ ...scenario, userId: user.id, email });
  }
  return users;
}

async function loginWithCredentials(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  const emailInput = page.getByPlaceholder("you@example.com");
  const passwordInput = page.getByPlaceholder(/Optional \(leave empty for magic link\)/i);
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.click();
  await emailInput.fill("");
  await emailInput.type(email, { delay: 20 });
  const typedEmail = await emailInput.inputValue();
  assert(typedEmail.trim().toLowerCase() === email.toLowerCase(), `Email not typed correctly: ${typedEmail}`);

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
  await page.waitForURL(/\/dashboard|\/api\/auth\/signin/, {
    timeout: 60000,
    waitUntil: "domcontentloaded",
  });
  if (!page.url().includes("/dashboard")) {
    const authError = await page.locator("p.text-red-600").first().textContent().catch(() => null);
    throw new Error(`Login did not reach dashboard for ${email}. authError=${authError || "n/a"}`);
  }
}

async function createCheckoutSession(context, targetPlan, billingPeriod) {
  const plansRes = await context.request.get(`${BASE_URL}/api/stripe/plans`);
  assert(plansRes.ok(), `GET /api/stripe/plans fallo (${plansRes.status()})`);
  const plansBody = await plansRes.json();
  const price = (plansBody.plans || []).find(
    (p) => p.plan === targetPlan && p.billingPeriod === billingPeriod
  );
  assert(price?.priceId, `No hay priceId para ${targetPlan}/${billingPeriod}`);

  const checkoutRes = await context.request.post(`${BASE_URL}/api/stripe/checkout`, {
    data: { priceId: price.priceId },
  });
  const checkoutBody = await checkoutRes.json().catch(() => ({}));
  assert(
    checkoutRes.ok() && checkoutBody.url,
    `POST /api/stripe/checkout fallo: ${checkoutRes.status()} ${JSON.stringify(checkoutBody)}`
  );
  return checkoutBody.url;
}

async function fillStripeCheckout(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);

  const allFrames = page.frames();
  let cardFilled = false;

  for (const frame of allFrames) {
    const number = frame.locator('input[name="cardnumber"], input[autocomplete="cc-number"]');
    if (await number.count()) {
      await number.first().fill("4242424242424242");

      const exp = frame.locator('input[name="exp-date"], input[autocomplete="cc-exp"]');
      if (await exp.count()) await exp.first().fill("12/34");

      const cvc = frame.locator('input[name="cvc"], input[autocomplete="cc-csc"]');
      if (await cvc.count()) await cvc.first().fill("123");

      const postal = frame.locator('input[name="postal"], input[autocomplete="postal-code"]');
      if (await postal.count()) await postal.first().fill("33101");

      cardFilled = true;
      break;
    }
  }

  assert(cardFilled, "No se encontro formulario de tarjeta en Stripe Checkout");

  const cardholderInput = page.locator(
    'input[name="name"], input[autocomplete="cc-name"], input[placeholder*="name" i]'
  );
  if (await cardholderInput.count()) {
    await cardholderInput.first().fill("Synthetic QA User");
  }

  const payButton = page.getByRole("button", {
    name: /Pay|Subscribe|Start subscription|Iniciar|Pagar/i,
  });
  await page.waitForFunction(
    () => {
      const candidates = Array.from(document.querySelectorAll("button"));
      const btn = candidates.find((b) =>
        /(Pay|Subscribe|Start subscription|Iniciar|Pagar)/i.test(b.textContent || "")
      );
      return Boolean(btn && !btn.hasAttribute("disabled"));
    },
    { timeout: 20000 }
  );
  await payButton.first().click();
}

async function waitForPlanUpgrade(context, expectedPlan) {
  const timeout = Date.now() + 90000;
  while (Date.now() < timeout) {
    const res = await context.request.get(`${BASE_URL}/api/profile`);
    if (res.ok()) {
      const body = await res.json();
      if (body.planType === expectedPlan) return true;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function runScenario(browser, scenario) {
  const out = {
    email: scenario.email,
    scenario: scenario.key,
    targetPlan: scenario.targetPlan,
    billingPeriod: scenario.billingPeriod,
    ok: false,
    error: null,
  };

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await loginWithCredentials(page, scenario.email, QA_TEST_PASSWORD);
    const checkoutUrl = await createCheckoutSession(
      context,
      scenario.targetPlan,
      scenario.billingPeriod
    );

    await page.goto(checkoutUrl, { waitUntil: "domcontentloaded" });
    await fillStripeCheckout(page);
    await page.waitForURL(/\/checkout\/success/, { timeout: 90000 });

    const upgraded = await waitForPlanUpgrade(context, scenario.targetPlan);
    assert(upgraded, `El plan no se actualizo a ${scenario.targetPlan}`);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${scenario.key}-success.png`),
      fullPage: true,
    });
    out.ok = true;
  } catch (error) {
    out.error = error instanceof Error ? error.message : String(error);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${scenario.key}-error.png`),
      fullPage: true,
    });
  } finally {
    await context.close();
  }

  return out;
}

async function main() {
  if (!QA_TEST_PASSWORD) throw new Error("Falta QA_TEST_PASSWORD");

  await mkdir(ARTIFACT_DIR, { recursive: true });
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: HEADLESS });

  try {
    const users = await bootstrapUsers();
    const results = await Promise.all(users.map((u) => runScenario(browser, u)));
    const okCount = results.filter((r) => r.ok).length;

    await writeFile(
      path.join(ARTIFACT_DIR, "summary.json"),
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          headless: HEADLESS,
          results,
          generatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf8"
    );

    console.log(`[synthetic-checkout] ${okCount}/${results.length} flows passed.`);
    for (const r of results) {
      console.log(`${r.ok ? "[OK]" : "[FAIL]"} ${r.email} -> ${r.targetPlan}/${r.billingPeriod}`);
      if (r.error) console.log(`  error: ${r.error}`);
    }
    console.log(`[synthetic-checkout] artifacts: ${ARTIFACT_DIR}`);

    if (okCount !== results.length) process.exitCode = 1;
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("[synthetic-checkout] failed:", error.message);
  await prisma.$disconnect();
  process.exit(1);
});
