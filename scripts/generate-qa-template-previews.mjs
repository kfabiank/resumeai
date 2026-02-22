#!/usr/bin/env node
/* eslint-disable no-console */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "qa-design-previews");

function parseTemplateIds(content) {
  const ids = [];
  const regex = /id:\s*'([^']+)'/g;
  let match = regex.exec(content);
  while (match) {
    ids.push(match[1]);
    match = regex.exec(content);
  }
  return Array.from(new Set(ids));
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

async function main() {
  const catalogPath = path.join(ROOT_DIR, "lib", "template-catalog.ts");
  const catalog = await readFile(catalogPath, "utf8");
  const templateIds = parseTemplateIds(catalog);
  if (!templateIds.length) throw new Error("No se encontraron template IDs.");

  await mkdir(OUTPUT_DIR, { recursive: true });
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1700, height: 2600 } });

  try {
    for (const id of templateIds) {
      const url = `${BASE_URL}/template-preview/${id}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      const target = page.locator("#thumbnail-root");
      await target.waitFor({ state: "visible", timeout: 30000 });
      await target.screenshot({
        path: path.join(OUTPUT_DIR, `${id}.png`),
      });
      console.log(`generated QA preview: ${id}.png`);
    }

    await writeFile(
      path.join(OUTPUT_DIR, "manifest.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: BASE_URL,
          templates: templateIds.map((id) => ({
            id,
            file: `/qa-design-previews/${id}.png`,
          })),
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`Done. Output: ${OUTPUT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[qa-preview-gen] failed:", error.message);
  process.exit(1);
});
