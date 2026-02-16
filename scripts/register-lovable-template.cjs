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
      args[key] = 'true';
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function toBool(value, fallback = false) {
  if (value == null) return fallback;
  return String(value).toLowerCase() === 'true';
}

function required(args, key) {
  if (!args[key]) {
    throw new Error(`Missing required arg --${key}`);
  }
  return args[key];
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function ensureImport(rendererContent, componentName) {
  const importLine = `import ${componentName} from '@/app/lovable-templates/${componentName}';`;
  if (rendererContent.includes(importLine)) return rendererContent;

  const lines = rendererContent.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startsWith('import ')) {
      lastImportIdx = i;
    }
  }
  if (lastImportIdx === -1) {
    throw new Error('Could not find import section in TemplateRenderer.tsx');
  }
  lines.splice(lastImportIdx + 1, 0, importLine);
  return lines.join('\n');
}

function ensureCase(rendererContent, templateId, componentName) {
  const caseLine = `    case '${templateId}':`;
  if (rendererContent.includes(caseLine)) return rendererContent;

  const insertion = `${caseLine}\n      return <${componentName} data={data} />;\n`;
  const marker = "    case 'consultant-pro':";
  if (rendererContent.includes(marker)) {
    return rendererContent.replace(marker, `${insertion}${marker}`);
  }

  const fallbackMarker = "    case 'simple-clean':";
  if (rendererContent.includes(fallbackMarker)) {
    return rendererContent.replace(fallbackMarker, `${insertion}${fallbackMarker}`);
  }

  throw new Error('Could not find switch-case insertion point in TemplateRenderer.tsx');
}

function ensureCatalogEntry(catalogContent, entry) {
  if (catalogContent.includes(`id: '${entry.id}'`)) return catalogContent;

  const block = `  {\n` +
    `    id: '${entry.id}',\n` +
    `    name: '${entry.name}',\n` +
    `    description: '${entry.description}',\n` +
    `    category: '${entry.category}',\n` +
    `    categoryLabel: '${entry.categoryLabel}',\n` +
    `    isPremium: ${entry.isPremium ? 'true' : 'false'},\n` +
    `    colors: '${entry.colors}',\n` +
    `  },\n`;

  const marker = '\n];\n\nexport const DEFAULT_TEMPLATE_ID';
  if (!catalogContent.includes(marker)) {
    throw new Error('Could not find TEMPLATE_CATALOG closing marker in template-catalog.ts');
  }
  return catalogContent.replace(marker, `\n${block}];\n\nexport const DEFAULT_TEMPLATE_ID`);
}

function copyTemplateSource(sourcePath, componentPath) {
  const sourceContent = readFile(sourcePath);
  writeFile(componentPath, sourceContent);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help === 'true') {
    console.log(
      [
        'Usage:',
        '  node scripts/register-lovable-template.cjs \\',
        '    --source "../resumeai-lovable/src/templates/FrontendTemplate.tsx" \\',
        '    --component "FrontEndTemplate" \\',
        '    --id "frontend-template-v2" \\',
        '    --name "Front-End Craft v2" \\',
        '    --description "Modern frontend-focused layout from Lovable." \\',
        '    --category "tech" \\',
        '    --categoryLabel "Tech" \\',
        '    --isPremium false \\',
        '    --colors "from-sky-500 to-indigo-700"',
      ].join('\n')
    );
    return;
  }

  const component = required(args, 'component');
  const id = required(args, 'id');
  const name = required(args, 'name');
  const description = required(args, 'description');
  const category = required(args, 'category');
  const categoryLabel = required(args, 'categoryLabel');
  const colors = required(args, 'colors');
  const isPremium = toBool(args.isPremium, false);
  const source = args.source ? path.resolve(process.cwd(), args.source) : null;

  const root = process.cwd();
  const componentPath = path.join(root, 'app', 'lovable-templates', `${component}.tsx`);
  const rendererPath = path.join(root, 'app', 'lovable-templates', 'TemplateRenderer.tsx');
  const catalogPath = path.join(root, 'lib', 'template-catalog.ts');

  if (source) {
    if (!fs.existsSync(source)) {
      throw new Error(`Source file not found: ${source}`);
    }
    copyTemplateSource(source, componentPath);
    console.log(`Copied template component to ${componentPath}`);
  } else if (!fs.existsSync(componentPath)) {
    throw new Error(`Component file does not exist and no --source was provided: ${componentPath}`);
  }

  let renderer = readFile(rendererPath);
  renderer = ensureImport(renderer, component);
  renderer = ensureCase(renderer, id, component);
  writeFile(rendererPath, renderer);
  console.log(`Updated renderer: ${rendererPath}`);

  let catalog = readFile(catalogPath);
  catalog = ensureCatalogEntry(catalog, {
    id,
    name,
    description,
    category,
    categoryLabel,
    isPremium,
    colors,
  });
  writeFile(catalogPath, catalog);
  console.log(`Updated catalog: ${catalogPath}`);

  console.log('Template registered successfully.');
}

main();
