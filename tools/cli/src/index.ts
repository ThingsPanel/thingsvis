#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import prompts from 'prompts';
import { normalizeCategory } from './categories.js';
import { copyTemplateDir } from './template.js';

const program = new Command();

program
  .name('vis-cli')
  .description('ThingsVis CLI for scaffolding plugins')
  .version('0.0.1');

program
  .command('create')
  .argument('<category>', 'plugin category (e.g., basic, layout, media, custom)')
  .argument('<name>', 'plugin name (kebab-case)')
  .description('Create a new plugin skeleton under plugins/<category>/<name>')
  .option('--port <port>', 'dev server port for rspack serve', (v: string) => Number(v))
  .action(async (categoryRaw: string, nameRaw: string, options: { port?: number }) => {
    const category = normalizeCategory(categoryRaw);
    const name = nameRaw.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      throw new Error(`Invalid name "${nameRaw}". Expected kebab-case (e.g., "my-plugin").`);
    }

    const repoRoot = process.cwd();
    const pluginsRoot = path.join(repoRoot, 'plugins');
    const targetDir = path.join(pluginsRoot, category, name);
    if (await fs.pathExists(targetDir)) {
      throw new Error(`Target already exists: ${targetDir}`);
    }

    const componentId = `${category}/${name}`;
    const packageName = `thingsvis-plugin-${category}-${name}`;

    let port = options.port;
    if (!port) {
      const result = await prompts({
        type: 'number',
        name: 'port',
        message: 'Dev server port for this plugin?',
        initial: 3200
      });
      port = Number(result.port) || 3200;
    }

    const templateDir = path.join(repoRoot, 'tools', 'cli', 'templates');
    await copyTemplateDir(templateDir, targetDir, {
      PACKAGE_NAME: packageName,
      COMPONENT_ID: componentId,
      CATEGORY: category,
      DEV_SERVER_PORT: port
    });

    // eslint-disable-next-line no-console
    console.log(`\n✅ Created plugin: ${componentId}`);
    // eslint-disable-next-line no-console
    console.log(`📁 Path: ${targetDir}`);
    // eslint-disable-next-line no-console
    console.log(`\n📝 Next steps:`);
    // eslint-disable-next-line no-console
    console.log(`   1. cd ${targetDir}`);
    // eslint-disable-next-line no-console
    console.log(`   2. pnpm install`);
    // eslint-disable-next-line no-console
    console.log(`   3. pnpm dev`);
  });

program.parse(process.argv);


