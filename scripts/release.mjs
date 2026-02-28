#!/usr/bin/env node
/**
 * ThingsVis 发版脚本
 * 用法: node scripts/release.mjs [patch|minor|major] [--dry-run]
 *
 * 功能:
 *  1. 读取并 bump 根 package.json 版本号
 *  2. 同步更新 apps/studio 和 apps/server 版本号（保持一致）
 *  3. 输出 git commit + tag 命令供确认后执行
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BUMP_TYPE = process.argv[2] || 'patch';
const DRY_RUN = process.argv.includes('--dry-run');

if (!['patch', 'minor', 'major'].includes(BUMP_TYPE)) {
  console.error(`❌ 无效的 bump 类型: "${BUMP_TYPE}"。必须是 patch | minor | major`);
  process.exit(1);
}

// ── 读取并 bump 版本号 ─────────────────────────────────────────────────────────
function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
  }
}

function updatePkg(relPath, newVersion) {
  const absPath = join(ROOT, relPath);
  const pkg = JSON.parse(readFileSync(absPath, 'utf8'));
  const oldVersion = pkg.version;
  pkg.version = newVersion;
  if (!DRY_RUN) {
    writeFileSync(absPath, JSON.stringify(pkg, null, 2) + '\n');
  }
  return oldVersion;
}

// ── 主逻辑 ─────────────────────────────────────────────────────────────────────
const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const currentVersion = rootPkg.version;
const nextVersion = bumpVersion(currentVersion, BUMP_TYPE);
const tag = `v${nextVersion}`;

console.log(`\n📦 ThingsVis 发版工具`);
console.log(`   类型: ${BUMP_TYPE}`);
console.log(`   版本: ${currentVersion} → ${nextVersion}`);
console.log(`   Tag:  ${tag}`);
if (DRY_RUN) console.log(`   模式: DRY RUN（不写入文件）\n`);

// 更新各包版本
const targets = [
  'package.json',
  'apps/studio/package.json',
  'apps/server/package.json',
];

for (const target of targets) {
  const old = updatePkg(target, nextVersion);
  const status = DRY_RUN ? '[dry]' : '✅';
  console.log(`${status} ${target}: ${old} → ${nextVersion}`);
}

// ── 输出待执行的 Git 命令 ──────────────────────────────────────────────────────
console.log(`\n📋 请依次执行以下命令完成发版:\n`);
console.log(`  git add package.json apps/studio/package.json apps/server/package.json`);
console.log(`  git commit -m "chore(release): bump version to ${nextVersion}"`);
console.log(`  git tag ${tag}`);
console.log(`  git push origin HEAD ${tag}`);
console.log(`\n⚡ 推送 tag 后，GitHub Actions release.yml 将自动触发。\n`);
