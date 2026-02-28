import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import { SecurityScanner } from './scanners/SecurityScanner';
import { PerformanceScanner } from './scanners/PerformanceScanner';
import { IsolationScanner } from './scanners/IsolationScanner';
import { DependencyScanner } from './scanners/DependencyScanner';
import chalk from 'chalk';

export interface AnalyzerOptions {
  path: string;
  categories?: string[];
}

export interface AnalysisReport {
  summary: {
    total: number;
    error: number;
    warning: number;
    info: number;
    autoFixable: number;
  };
  issues: Issue[];
  timestamp: string;
}

export interface Issue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'security' | 'performance' | 'isolation' | 'dependency';
  description: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  code: string;
  fix?: string;
  autoFixable: boolean;
}

export class IsolationAnalyzer {
  private scanners: Map<string, any>;
  
  constructor(private options: AnalyzerOptions) {
    this.scanners = new Map([
      ['security', new SecurityScanner()],
      ['performance', new PerformanceScanner()],
      ['isolation', new IsolationScanner()],
      ['dependency', new DependencyScanner()]
    ]);
  }
  
  async run(): Promise<AnalysisReport> {
    const issues: Issue[] = [];
    const categories = this.options.categories || ['security', 'performance', 'isolation', 'dependency'];
    
    const sourceFiles = await glob('**/*.{ts,tsx}', {
      cwd: this.options.path,
      ignore: ['node_modules/**', 'dist/**', 'build/**']
    });
    
    console.log(chalk.gray(`   扫描 ${sourceFiles.length} 个文件...`));
    
    for (const file of sourceFiles) {
      const content = await readFile(`${this.options.path}/${file}`, 'utf-8');
      
      for (const category of categories) {
        const scanner = this.scanners.get(category);
        if (scanner) {
          const fileIssues = await scanner.scan(file, content);
          issues.push(...fileIssues);
        }
      }
    }
    
    if (categories.includes('dependency')) {
      const depScanner = this.scanners.get('dependency');
      const depIssues = await depScanner.scanPackages(this.options.path);
      issues.push(...depIssues);
    }
    
    const summary = {
      total: issues.length,
      error: issues.filter(i => i.severity === 'error').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      autoFixable: issues.filter(i => i.autoFixable).length
    };
    
    return {
      summary,
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async saveReport(report: AnalysisReport, outputPath: string, format: string): Promise<void> {
    let content: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        break;
      case 'html':
        content = this.generateHTMLReport(report);
        break;
      case 'markdown':
        content = this.generateMarkdownReport(report);
        break;
      default:
        content = JSON.stringify(report, null, 2);
    }
    
    await writeFile(outputPath, content, 'utf-8');
  }
  
  private generateHTMLReport(report: AnalysisReport): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>ThingsVis Isolation Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat { padding: 20px; border-radius: 8px; text-align: center; }
    .stat.error { background: #fee; color: #c00; }
    .stat.warning { background: #ffeaa7; color: #b35900; }
    .stat.info { background: #e3f2fd; color: #1565c0; }
    .stat.success { background: #e8f5e9; color: #2e7d32; }
    .issue { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
    .issue.error { border-left: 4px solid #c00; }
    .code { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <h1>ThingsVis 隔离分析报告</h1>
  <p>生成时间: ${report.timestamp}</p>
  <div class="summary">
    <div class="stat error"><div style="font-size: 32px; font-weight: bold;">${report.summary.error}</div><div>错误</div></div>
    <div class="stat warning"><div style="font-size: 32px; font-weight: bold;">${report.summary.warning}</div><div>警告</div></div>
    <div class="stat info"><div style="font-size: 32px; font-weight: bold;">${report.summary.info}</div><div>提示</div></div>
    <div class="stat success"><div style="font-size: 32px; font-weight: bold;">${report.summary.autoFixable}</div><div>可自动修复</div></div>
  </div>
  <h2>问题列表</h2>
  ${report.issues.map(issue => `
    <div class="issue ${issue.severity}">
      <strong>${issue.description}</strong>
      <p>📍 ${issue.location.file}:${issue.location.line}</p>
      <div class="code">${issue.code}</div>
      ${issue.fix ? `<p>💡 修复建议: ${issue.fix}</p>` : ''}
    </div>
  `).join('')}
</body>
</html>`;
  }
  
  private generateMarkdownReport(report: AnalysisReport): string {
    return `# ThingsVis 隔离分析报告

生成时间: ${report.timestamp}

## 摘要

| 类型 | 数量 |
|------|------|
| 错误 | ${report.summary.error} |
| 警告 | ${report.summary.warning} |
| 提示 | ${report.summary.info} |

## 问题详情

${report.issues.map(issue => `
### ${issue.description}
- **级别**: ${issue.severity}
- **类别**: ${issue.category}
- **位置**: \`${issue.location.file}:${issue.location.line}\`
\`\`\`typescript
${issue.code}
\`\`\`
${issue.fix ? `**修复建议**: ${issue.fix}` : ''}
`).join('\n---\n')}`;
  }
}
