#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import prompts from 'prompts';
import { spawn } from 'node:child_process';
import { normalizeCategory } from './categories.js';
import { copyTemplateDir } from './template.js';

type ValidationCheck = {
  name: string;
  ok: boolean;
  details?: string;
};

const program = new Command();

program
  .name('vis-cli')
  .description('ThingsVis CLI for scaffolding and validating widgets')
  .version('0.1.0');

function isKebabName(input: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input);
}

function flattenKeys(input: unknown, prefix = ''): string[] {
  if (input === null || input === undefined) return [];
  if (Array.isArray(input)) {
    return input.flatMap((item, index) => flattenKeys(item, `${prefix}[${index}]`));
  }
  if (typeof input === 'object') {
    return Object.entries(input as Record<string, unknown>).flatMap(([k, v]) => {
      const next = prefix ? `${prefix}.${k}` : k;
      return [next, ...flattenKeys(v, next)];
    });
  }
  return [];
}

function checkLocaleKeysEqual(base: unknown, target: unknown): { ok: boolean; details?: string } {
  const a = new Set(flattenKeys(base));
  const b = new Set(flattenKeys(target));
  const onlyA = [...a].filter((k) => !b.has(k));
  const onlyB = [...b].filter((k) => !a.has(k));

  if (!onlyA.length && !onlyB.length) {
    return { ok: true };
  }

  const details = [
    onlyA.length ? `missing in target: ${onlyA.slice(0, 8).join(', ')}` : '',
    onlyB.length ? `extra in target: ${onlyB.slice(0, 8).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  return { ok: false, details };
}

function resolveWidgetDir(repoRoot: string, widgetPathOrId: string): string {
  const raw = widgetPathOrId.trim();

  if (!raw) {
    throw new Error('widget path is required');
  }

  const absoluteCandidate = path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);
  if (fs.existsSync(absoluteCandidate) && fs.statSync(absoluteCandidate).isDirectory()) {
    return absoluteCandidate;
  }

  if (/^[a-z0-9-]+\/[a-z0-9-]+$/.test(raw)) {
    const componentPath = path.join(repoRoot, 'packages', 'widgets', raw.replace('/', path.sep));
    if (fs.existsSync(componentPath) && fs.statSync(componentPath).isDirectory()) {
      return componentPath;
    }
  }

  throw new Error(`Widget path not found: ${widgetPathOrId}`);
}

async function runScript(command: string, args: string[], cwd: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`));
      }
    });
  });
}

async function collectFiles(
  dir: string,
  predicate: (filePath: string) => boolean,
): Promise<string[]> {
  if (!(await fs.pathExists(dir))) {
    return [];
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(filePath, predicate);
      }
      return predicate(filePath) ? [filePath] : [];
    }),
  );

  return files.flat();
}

async function findWidgetTestFiles(repoRoot: string, widgetDir: string): Promise<string[]> {
  const allFiles = await collectFiles(widgetDir, (filePath) =>
    /\.(test|spec)\.[cm]?[tj]sx?$/.test(filePath),
  );

  return allFiles.map((filePath) => path.relative(repoRoot, filePath));
}

async function validateWidget(widgetDir: string): Promise<ValidationCheck[]> {
  const checks: ValidationCheck[] = [];
  const pkgPath = path.join(widgetDir, 'package.json');
  const indexPath = path.join(widgetDir, 'src', 'index.ts');
  const metadataPath = path.join(widgetDir, 'src', 'metadata.ts');
  const schemaPath = path.join(widgetDir, 'src', 'schema.ts');
  const controlsPath = path.join(widgetDir, 'src', 'controls.ts');
  const localesDir = path.join(widgetDir, 'src', 'locales');

  let pkg: Record<string, unknown> | null = null;

  if (!(await fs.pathExists(pkgPath))) {
    checks.push({ name: 'package.json exists', ok: false, details: 'missing package.json' });
  } else {
    try {
      const raw = await fs.readFile(pkgPath, 'utf8');
      pkg = JSON.parse(raw) as Record<string, unknown>;
      const name = typeof pkg.name === 'string' && pkg.name.length > 0;
      const version = typeof pkg.version === 'string' && pkg.version.length > 0;
      checks.push({ name: 'package fields: name/version', ok: name && version, details: name && version ? undefined : 'missing name or version' });
    } catch (error) {
      checks.push({ name: 'package.json parse', ok: false, details: error instanceof Error ? error.message : String(error) });
    }
  }

  if (!(await fs.pathExists(indexPath))) {
    checks.push({ name: 'src/index.ts exists', ok: false, details: 'missing src/index.ts' });
  } else {
    const content = await fs.readFile(indexPath, 'utf8');
    const hasCanonicalEntry = /defineWidget\(/.test(content);
    checks.push({
      name: 'canonical defineWidget entry detected',
      ok: hasCanonicalEntry,
      details: hasCanonicalEntry ? undefined : 'expected src/index.ts to export a defineWidget(...) entry',
    });
  }

  checks.push({
    name: 'src/metadata.ts exists',
    ok: await fs.pathExists(metadataPath),
    details: (await fs.pathExists(metadataPath)) ? undefined : 'missing src/metadata.ts',
  });

  if (!(await fs.pathExists(schemaPath))) {
    checks.push({ name: 'src/schema.ts exists', ok: false, details: 'missing src/schema.ts' });
  } else {
    const content = await fs.readFile(schemaPath, 'utf8');
    const hasSchema = /z\.object\(/.test(content);
    const hasDefaultFactory = /parse\(\{\}\)/.test(content);
    checks.push({
      name: 'schema contract',
      ok: hasSchema && hasDefaultFactory,
      details: hasSchema && hasDefaultFactory ? undefined : 'expected z.object(...) and parse({}) default factory',
    });
  }

  if (!(await fs.pathExists(controlsPath))) {
    checks.push({ name: 'src/controls.ts exists', ok: false, details: 'missing src/controls.ts' });
  } else {
    const content = await fs.readFile(controlsPath, 'utf8');
    const hasControlsBuilder = /generateControls\(/.test(content) || /createControlPanel\(/.test(content);
    checks.push({ name: 'controls config detected', ok: hasControlsBuilder, details: hasControlsBuilder ? undefined : 'expected generateControls(...) or createControlPanel(...)' });
  }

  const zhPath = path.join(localesDir, 'zh.json');
  const enPath = path.join(localesDir, 'en.json');
  if (!(await fs.pathExists(localesDir))) {
    checks.push({ name: 'src/locales exists', ok: false, details: 'missing src/locales directory' });
  } else if (!(await fs.pathExists(zhPath)) || !(await fs.pathExists(enPath))) {
    checks.push({ name: 'locales presence', ok: false, details: 'expected both src/locales/zh.json and src/locales/en.json' });
  } else {
    try {
      const zh = await fs.readJson(zhPath);
      const en = await fs.readJson(enPath);
      const keyCheck = checkLocaleKeysEqual(zh, en);
      checks.push({ name: 'locale key parity (zh/en)', ok: keyCheck.ok, details: keyCheck.details });
    } catch (error) {
      checks.push({ name: 'locale json parse', ok: false, details: error instanceof Error ? error.message : String(error) });
    }
  }

  if (pkg && typeof pkg.thingsvis === 'object' && pkg.thingsvis !== null) {
    const tv = pkg.thingsvis as Record<string, unknown>;
    const displayName = typeof tv.displayName === 'string' && tv.displayName.length > 0;
    checks.push({ name: 'thingsvis.displayName', ok: displayName, details: displayName ? undefined : 'missing thingsvis.displayName' });
  }

  return checks;
}

function printValidationReport(widgetDir: string, checks: ValidationCheck[]): void {
  console.log(`\nValidation report: ${widgetDir}`);
  for (const check of checks) {
    const icon = check.ok ? 'OK' : 'FAIL';
    const suffix = check.details ? ` - ${check.details}` : '';
    console.log(`- [${icon}] ${check.name}${suffix}`);
  }
}

program
  .command('create')
  .argument('<category>', 'widget category (e.g., basic, layout, media, custom)')
  .argument('<name>', 'widget name (kebab-case)')
  .description('Create a new widget skeleton under widgets/<category>/<name>')
  .option('--port <port>', 'dev server port for rspack serve', (v: string) => Number(v))
  .action(async (categoryRaw: string, nameRaw: string, options: { port?: number }) => {
    const category = normalizeCategory(categoryRaw);
    const name = nameRaw.trim().toLowerCase();
    if (!isKebabName(name)) {
      throw new Error(`Invalid name "${nameRaw}". Expected kebab-case (e.g., "my-widget").`);
    }

    const repoRoot = process.cwd();
    const widgetsRoot = path.join(repoRoot, 'packages', 'widgets');
    const targetDir = path.join(widgetsRoot, category, name);
    if (await fs.pathExists(targetDir)) {
      throw new Error(`Target already exists: ${targetDir}`);
    }

    const componentId = `${category}/${name}`;
    const packageName = `thingsvis-widget-${category}-${name}`;

    let port = options.port;
    if (!port) {
      const result = await prompts([
        {
          type: 'number',
          name: 'port',
          message: 'Dev server port for this widget?',
          initial: 3200,
        },
        {
          type: 'text',
          name: 'displayName',
          message: 'Display name for this widget (e.g., My Widget)?',
          initial: name,
        },
      ]);
      port = Number(result.port) || 3200;
      (options as { displayName?: string }).displayName = result.displayName || name;
    }

    const templateDir = path.join(repoRoot, 'tools', 'cli', 'templates');
    await copyTemplateDir(templateDir, targetDir, {
      PACKAGE_NAME: packageName,
      COMPONENT_ID: componentId,
      CATEGORY: category,
      DEV_SERVER_PORT: port,
      DISPLAY_NAME: (options as { displayName?: string }).displayName || name,
    });

    console.log(`\nCreated widget: ${componentId}`);
    console.log(`Path: ${targetDir}`);
    console.log('\nNext steps:');
    console.log(`  1. cd ${targetDir}`);
    console.log('  2. pnpm install');
    console.log('  3. pnpm dev');
  });

program
  .command('validate')
  .argument('<widget-path-or-component-id>', 'widget path (e.g. widgets/basic/text) or component id (e.g. basic/text)')
  .description('Validate widget package contracts (package/index/schema/controls/locales)')
  .action(async (widgetPathOrId: string) => {
    const repoRoot = process.cwd();
    const widgetDir = resolveWidgetDir(repoRoot, widgetPathOrId);
    const checks = await validateWidget(widgetDir);
    printValidationReport(widgetDir, checks);

    const hasFail = checks.some((c) => !c.ok);
    if (hasFail) {
      throw new Error('Validation failed');
    }

    console.log('\nAll checks passed.');
  });

program
  .command('verify')
  .argument('<widget-path-or-component-id>', 'widget path (e.g. widgets/basic/text) or component id (e.g. basic/text)')
  .description('Verify a widget package via validate + typecheck + widget-local tests when present')
  .action(async (widgetPathOrId: string) => {
    const repoRoot = process.cwd();
    const widgetDir = resolveWidgetDir(repoRoot, widgetPathOrId);
    const checks = await validateWidget(widgetDir);
    printValidationReport(widgetDir, checks);

    const hasFail = checks.some((c) => !c.ok);
    if (hasFail) {
      throw new Error('Validation failed');
    }

    await runScript('pnpm', ['typecheck'], widgetDir);

    const testFiles = await findWidgetTestFiles(repoRoot, widgetDir);
    if (testFiles.length > 0) {
      await runScript('pnpm', ['test', '--', '--run', ...testFiles], repoRoot);
    } else {
      console.log('\nNo widget-local test files found; skipped vitest.');
    }

    console.log('\nVerification passed.');
  });

program
  .command('build')
  .argument('<widget-path-or-component-id>', 'widget path (e.g. widgets/basic/text) or component id (e.g. basic/text)')
  .description('Build a single widget package')
  .action(async (widgetPathOrId: string) => {
    const repoRoot = process.cwd();
    const widgetDir = resolveWidgetDir(repoRoot, widgetPathOrId);
    await runScript('pnpm', ['build'], widgetDir);
  });

program
  .command('dev')
  .argument('<widget-path-or-component-id>', 'widget path (e.g. widgets/basic/text) or component id (e.g. basic/text)')
  .description('Run dev server for a single widget package')
  .action(async (widgetPathOrId: string) => {
    const repoRoot = process.cwd();
    const widgetDir = resolveWidgetDir(repoRoot, widgetPathOrId);
    await runScript('pnpm', ['dev'], widgetDir);
  });

program.parse(process.argv);
