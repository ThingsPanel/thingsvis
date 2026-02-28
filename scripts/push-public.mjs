#!/usr/bin/env node
/**
 * push-public.mjs
 * 安全推送到开源仓库，自动处理内部文件的隐藏和还原
 *
 * 用法:
 *   node scripts/push-public.mjs [--remote public] [--branch main] [--dry-run]
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

// ============================================================
// 配置：内部文件列表（不进入开源仓库）
// ============================================================
const INTERNAL_FILES = [
  'docs/',
  '.agents/',
  'specs/',
  'excalidraw-analysis/',
  'iteration-log.md',
  'widget-iteration-log.md',
  'project-context.md',
  'task-spec.md',
  'implementation-plan.md',
  'thingsvis.code-workspace',
  'scripts/push-public.mjs', // 本脚本自身
];

// ============================================================
// 解析参数
// ============================================================
const args = process.argv.slice(2);
const remote = args.find((_, i) => args[i - 1] === '--remote') ?? 'public';
const branch = args.find((_, i) => args[i - 1] === '--branch') ?? 'main';
const dryRun = args.includes('--dry-run');

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  if (dryRun && !opts.always) return '';
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
}

function runAlways(cmd) {
  return run(cmd, { always: true });
}

// ============================================================
// 检查 remote 是否存在
// ============================================================
function checkRemote() {
  try {
    const remotes = runAlways('git remote');
    if (!remotes.split('\n').includes(remote)) {
      console.error(`\n❌ Remote "${remote}" 不存在。请先添加：`);
      console.error(`   git remote add ${remote} git@github.com:你的用户名/thingsvis.git\n`);
      process.exit(1);
    }
  } catch {
    process.exit(1);
  }
}

// ============================================================
// 获取当前已追踪的内部文件（过滤掉不存在的）
// ============================================================
function getTrackedInternalFiles() {
  const tracked = runAlways('git ls-files').split('\n');
  const result = [];
  for (const pattern of INTERNAL_FILES) {
    const matched = tracked.filter(f =>
      pattern.endsWith('/') ? f.startsWith(pattern) : f === pattern
    );
    if (matched.length > 0) result.push(...matched);
  }
  return [...new Set(result)];
}

// ============================================================
// 检查工作区是否干净
// ============================================================
function checkWorkingTree() {
  const status = runAlways('git status --porcelain');
  if (status) {
    console.error('\n❌ 工作区有未提交的改动，请先 commit 或 stash：');
    console.error(status);
    process.exit(1);
  }
}

// ============================================================
// 主流程
// ============================================================
async function main() {
  console.log(`\n🚀 ThingsVis 开源推送工具`);
  console.log(`   Remote: ${remote}  Branch: ${branch}${dryRun ? '  [DRY RUN]' : ''}\n`);

  // 1. 前置检查
  checkRemote();
  checkWorkingTree();

  // 2. 找出需要隐藏的内部文件
  const toHide = getTrackedInternalFiles();
  if (toHide.length > 0) {
    console.log(`📦 暂时移出追踪的内部文件 (${toHide.length} 个):`);
    toHide.forEach(f => console.log(`   - ${f}`));
    console.log('');

    run(`git rm --cached -r ${toHide.map(f => `"${f}"`).join(' ')}`);
    run(`git commit --no-verify -m "chore(internal): temp remove internal files for public push"`);
  } else {
    console.log('✅ 无内部文件需要隐藏\n');
  }

  // 3. 推送到公开仓库
  console.log(`\n⬆️  推送到 ${remote}/${branch}...`);
  run(`git push ${remote} HEAD:${branch}`);
  console.log('✅ 推送成功！\n');

  // 4. 还原内部文件追踪
  if (toHide.length > 0) {
    console.log('🔁 还原内部文件追踪...');
    run(`git add ${toHide.map(f => `"${f}"`).join(' ')}`);
    run(`git commit --no-verify -m "chore(internal): restore internal files tracking"`);
    console.log('✅ 内部文件已还原\n');
  }

  console.log('🎉 完成！内部仓库和开源仓库均已同步。\n');
}

main().catch(err => {
  console.error('\n❌ 错误:', err.message);
  process.exit(1);
});
