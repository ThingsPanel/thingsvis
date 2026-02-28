#!/usr/bin/env node
import { Command } from 'commander';
import { IsolationAnalyzer } from './IsolationAnalyzer';
import { FixEngine } from './FixEngine';
import chalk from 'chalk';

const program = new Command();

program
  .name('isolation-analyzer')
  .description('ThingsVis 隔离问题分析工具')
  .version('0.1.0');

program
  .command('analyze')
  .description('分析项目隔离问题')
  .option('-p, --path <path>', '项目路径', './')
  .option('-o, --output <file>', '输出报告文件', 'isolation-report.json')
  .option('--format <format>', '输出格式 (json|html|markdown)', 'json')
  .option('--security', '仅检查安全问题')
  .option('--performance', '仅检查性能问题')
  .option('--isolation', '仅检查隔离问题')
  .action(async (options) => {
    console.log(chalk.blue('🔍 开始分析隔离问题...'));
    
    const categories = options.security ? ['security'] : 
                      options.performance ? ['performance'] :
                      options.isolation ? ['isolation'] : 
                      ['security', 'performance', 'isolation', 'dependency'];
    
    const analyzer = new IsolationAnalyzer({
      path: options.path,
      categories
    });
    
    const report = await analyzer.run();
    
    console.log(chalk.green('\n📊 分析完成！'));
    console.log(`   发现问题: ${report.summary.total}`);
    console.log(`   - 错误: ${chalk.red(report.summary.error)}`);
    console.log(`   - 警告: ${chalk.yellow(report.summary.warning)}`);
    console.log(`   - 提示: ${chalk.blue(report.summary.info)}`);
    console.log(`   可自动修复: ${chalk.green(report.summary.autoFixable)}`);
    
    await analyzer.saveReport(report, options.output, options.format);
    console.log(chalk.gray(`\n📄 报告已保存: ${options.output}`));
    
    if (report.summary.error > 0) {
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('自动修复隔离问题')
  .option('-p, --path <path>', '项目路径', './')
  .option('--dry-run', '试运行，不实际修改文件')
  .option('--max <n>', '最大修复数量', '10')
  .option('--category <cat>', '仅修复指定类别 (security|performance|isolation)')
  .action(async (options) => {
    console.log(chalk.blue('🔧 开始自动修复...'));
    
    const fixer = new FixEngine({
      path: options.path,
      dryRun: options.dryRun,
      maxFixes: parseInt(options.max),
      category: options.category
    });
    
    const result = await fixer.run();
    
    console.log(chalk.green('\n✅ 修复完成！'));
    console.log(`   已修复: ${result.fixed}`);
    console.log(`   跳过: ${result.skipped}`);
    console.log(`   失败: ${result.failed}`);
    
    if (options.dryRun) {
      console.log(chalk.yellow('\n⚠️ 这是试运行，未实际修改文件'));
    }
  });

program.parse();
