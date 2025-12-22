#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
let ComponentRegistrySchema = null;
try {
  // Prefer package export
  const pkg = require('@thingsvis/schema');
  ComponentRegistrySchema = pkg.ComponentRegistrySchema || (pkg.ComponentRegistry && pkg.ComponentRegistry.ComponentRegistrySchema);
} catch (e) {
  try {
    ComponentRegistrySchema = require('../packages/thingsvis-schema/dist').ComponentRegistrySchema || require('../packages/thingsvis-schema/src/component-registry').ComponentRegistrySchema;
  } catch (err) {
    ComponentRegistrySchema = null;
  }
}

function loadRegistry(registryPath) {
  const abs = path.resolve(registryPath);
  if (!fs.existsSync(abs)) {
    console.error('registry not found:', abs);
    process.exit(2);
  }
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw);
}

function main() {
  const registryPath = process.argv[2] || 'apps/preview/public/registry.json';
  const registry = loadRegistry(registryPath);
  try {
    // Try to validate using zod schema if available
    if (ComponentRegistrySchema && typeof ComponentRegistrySchema.parse === 'function') {
      ComponentRegistrySchema.parse(registry);
      console.log('Registry validated OK');
      process.exit(0);
    } else {
      console.log('ComponentRegistrySchema not available; basic check passed');
      process.exit(0);
    }
  } catch (e) {
    console.error('Registry validation failed:', e.message || e);
    process.exit(3);
  }
}

if (require.main === module) main();


