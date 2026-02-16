#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDirSafe(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return { copied: 0, skipped: true };
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  ensureDir(destDir);
  let copied = 0;
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copied += copyDirRecursive(srcPath, destPath).copied;
      continue;
    }
    copyFile(srcPath, destPath);
    copied += 1;
  }
  return { copied, skipped: false };
}

function exists(p) {
  return fs.existsSync(p);
}

function writeNotes(destRoot, sourceRoot) {
  const notesPath = path.join(destRoot, 'MIGRATION_NOTES.md');
  const content = `# Lovable -> Next.js Migration Notes

Source copied from:
\`${sourceRoot}\`

This folder is a staging area. Files are not wired automatically into Next.js routes.

## Suggested integration order

1. Tokens/styles:
   - Review \`meta/tailwind.config.ts\`
   - Merge CSS variables into \`app/globals.css\`

2. Shared UI components:
   - Start with \`src/components\`
   - Move reusable parts to \`components/\` or \`app/_components/\`

3. Pages:
   - Convert each staged page from \`src/pages\` to \`app/<route>/page.tsx\`
   - Replace \`react-router-dom\` with \`next/link\` + \`useRouter\`

4. Hooks/lib:
   - Merge only UI-safe helpers from \`src/hooks\` and \`src/lib\`
   - Do not overwrite backend/auth logic in \`resumeai\`

5. Assets:
   - Copy staged \`public\` assets to root \`public/\` as needed

## Important

- Keep Next.js API/auth/Prisma files unchanged.
- Do not copy \`vite.config\`, \`index.html\`, or Lovable \`main.tsx\` into Next.js runtime paths.
- Validate after each page migration:
  - \`npm run dev\`
  - \`npm run build\`
`;
  fs.writeFileSync(notesPath, content, 'utf8');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  node scripts/migrate-lovable-ui.cjs \\
    --source ../resume-ai-connector \\
    [--dest .migration/lovable] \\
    [--clean]

What it does:
  - Copies Lovable UI files into a staging folder in this repo.
  - Does NOT overwrite Next.js app files.
`);
    process.exit(0);
  }

  const cwd = process.cwd();
  const sourceArg = args.source || '../resume-ai-connector';
  const sourceRoot = path.resolve(cwd, sourceArg);
  const destArg = args.dest || '.migration/lovable';
  const destRoot = path.resolve(cwd, destArg);

  if (!exists(sourceRoot)) {
    throw new Error(`Source repo not found: ${sourceRoot}`);
  }

  if (args.clean) {
    removeDirSafe(destRoot);
  }
  ensureDir(destRoot);

  const mappings = [
    { from: 'src/components', to: 'src/components' },
    { from: 'src/pages', to: 'src/pages' },
    { from: 'src/hooks', to: 'src/hooks' },
    { from: 'src/lib', to: 'src/lib' },
    { from: 'src/styles', to: 'src/styles' },
    { from: 'public', to: 'public' },
  ];

  let totalCopied = 0;
  const summary = [];

  for (const map of mappings) {
    const src = path.join(sourceRoot, map.from);
    const dest = path.join(destRoot, map.to);
    const result = copyDirRecursive(src, dest);
    totalCopied += result.copied;
    summary.push(
      `${map.from} -> ${map.to} : ${
        result.skipped ? 'skipped (not found)' : `${result.copied} files`
      }`
    );
  }

  const metaDir = path.join(destRoot, 'meta');
  ensureDir(metaDir);
  const metaFiles = [
    'package.json',
    'tailwind.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'vite.config.ts',
    'vite.config.js',
    'tsconfig.json',
  ];
  for (const file of metaFiles) {
    const src = path.join(sourceRoot, file);
    if (!exists(src)) continue;
    copyFile(src, path.join(metaDir, file));
    totalCopied += 1;
  }

  writeNotes(destRoot, sourceRoot);

  console.log('Lovable UI staging completed.');
  console.log(`Source: ${sourceRoot}`);
  console.log(`Destination: ${destRoot}`);
  console.log(`Total files copied: ${totalCopied}`);
  console.log('\nSummary:');
  for (const line of summary) {
    console.log(`- ${line}`);
  }
  console.log('\nNext step: open the staging folder and migrate page-by-page into Next.js.');
}

main();
