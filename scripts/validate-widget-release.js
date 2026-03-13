#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WIDGETS_DIR = path.join(ROOT, 'packages', 'widgets');
const registryArg = process.argv[2];
const registryPath = path.resolve(ROOT, registryArg || 'apps/studio/dist/registry.json');

function sanitizeMfName(name) {
  return String(name).replace(/[^a-zA-Z0-9_]/g, '_');
}

function fail(message, details = []) {
  console.error(`\n[validate-widget-release] ${message}`);
  details.forEach((detail) => console.error(`- ${detail}`));
  process.exit(1);
}

if (!fs.existsSync(WIDGETS_DIR)) {
  fail('Widgets directory not found.', [WIDGETS_DIR]);
}

if (!fs.existsSync(registryPath)) {
  fail('Registry file not found.', [registryPath]);
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const components = registry?.components;

if (!components || typeof components !== 'object') {
  fail('Registry does not contain a valid components map.', [registryPath]);
}

const problems = [];
let widgetCount = 0;

const categories = fs.readdirSync(WIDGETS_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory());

for (const category of categories) {
  const categoryPath = path.join(WIDGETS_DIR, category.name);
  const widgets = fs.readdirSync(categoryPath, { withFileTypes: true }).filter((entry) => entry.isDirectory());

  for (const widget of widgets) {
    const widgetDir = path.join(categoryPath, widget.name);
    const packageJsonPath = path.join(widgetDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    widgetCount += 1;
    const componentId = `${category.name}/${widget.name}`;
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const entry = components[componentId];
    const distRemoteEntryPath = path.join(widgetDir, 'dist', 'remoteEntry.js');
    const expectedRemoteName = sanitizeMfName(pkg.name);
    const expectedStaticEntryUrl = `/widgets/${componentId}/dist/remoteEntry.js`;

    if (!entry) {
      problems.push(`Missing registry entry for ${componentId}`);
      continue;
    }

    if (entry.remoteName !== expectedRemoteName) {
      problems.push(
        `Registry remoteName mismatch for ${componentId}: expected ${expectedRemoteName}, got ${entry.remoteName || '<empty>'}`,
      );
    }

    if (entry.staticEntryUrl !== expectedStaticEntryUrl) {
      problems.push(
        `Registry staticEntryUrl mismatch for ${componentId}: expected ${expectedStaticEntryUrl}, got ${entry.staticEntryUrl || '<empty>'}`,
      );
    }

    if (!fs.existsSync(distRemoteEntryPath)) {
      problems.push(`Missing built artifact for ${componentId}: ${path.relative(ROOT, distRemoteEntryPath)}`);
    }
  }
}

if (problems.length > 0) {
  fail(`Widget release validation failed for ${problems.length} issue(s).`, problems);
}

console.log(`[validate-widget-release] OK: validated ${widgetCount} widgets against ${path.relative(ROOT, registryPath)}`);
