import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import chalk from 'chalk';

export interface FixOptions {
  path: string;
  dryRun: boolean;
  maxFixes: number;
  category?: string;
}

export interface FixResult {
  fixed: number;
  skipped: number;
  failed: number;
  details: FixDetail[];
}

export interface FixDetail {
  file: string;
  type: string;
  success: boolean;
  message: string;
}

export class FixEngine {
  private fixesApplied = 0;
  
  constructor(private options: FixOptions) {}
  
  async run(): Promise<FixResult> {
    const result: FixResult = {
      fixed: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    // 获取所有 TypeScript 文件
    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.options.path,
      ignore: ['node_modules/**', 'dist/**']
    });
    
    for (const file of files) {
      if (this.fixesApplied >= this.options.maxFixes) {
        console.log(chalk.yellow(`   已达到最大修复数量限制 (${this.options.maxFixes})`));
        break;
      }
      
      const filePath = `${this.options.path}/${file}`;
      const content = await readFile(filePath, 'utf-8');
      
      // 应用修复规则
      let newContent = content;
      
      // 修复 1: innerHTML → DOMPurify.sanitize()
      if (!this.options.category || this.options.category === 'security') {
        newContent = this.fixInnerHTML(newContent, result, file);
      }
      
      // 修复 2: 添加 Error Boundary
      if (!this.options.category || this.options.category === 'isolation') {
        newContent = this.fixMissingErrorBoundary(newContent, result, file);
      }
      
      // 修复 3: ResizeObserver 清理
      if (!this.options.category || this.options.category === 'performance') {
        newContent = this.fixResizeObserverCleanup(newContent, result, file);
      }
      
      // 写入文件
      if (newContent !== content) {
        if (!this.options.dryRun) {
          await writeFile(filePath, newContent, 'utf-8');
        }
        this.fixesApplied++;
      }
    }
    
    return result;
  }
  
  private fixInnerHTML(content: string, result: FixResult, file: string): string {
    // 检测未受保护的 innerHTML
    const innerHTMLPattern = /(\w+)\.innerHTML\s*=\s*([^;]+);/g;
    
    return content.replace(innerHTMLPattern, (match, element, value) => {
      // 检查是否已经有 DOMPurify
      if (content.includes('DOMPurify') || content.includes('textContent')) {
        return match;
      }
      
      result.fixed++;
      result.details.push({
        file,
        type: 'xss-innerHTML',
        success: true,
        message: `修复 innerHTML: ${element}`
      });
      
      // 添加导入并替换
      return `// TODO: 添加 import DOMPurify from 'dompurify';
${element}.innerHTML = DOMPurify.sanitize(${value});`;
    });
  }
  
  private fixMissingErrorBoundary(content: string, result: FixResult, file: string): string {
    // 检测 Widget render 函数
    if (!content.includes('defineWidget') || content.includes('try {')) {
      return content;
    }
    
    // 简单检测：如果 render 函数没有 try-catch，添加 Error Boundary 模式
    const renderPattern = /render:\s*\(([^)]+)\)\s*=>\s*\{/g;
    
    if (renderPattern.test(content) && !content.includes('WidgetErrorBoundary')) {
      result.details.push({
        file,
        type: 'missing-error-boundary',
        success: false,
        message: '需要手动添加 Error Boundary（太复杂，无法自动修复）'
      });
      result.skipped++;
    }
    
    return content;
  }
  
  private fixResizeObserverCleanup(content: string, result: FixResult, file: string): string {
    // 检测 ResizeObserver 使用但没有 disconnect
    if (content.includes('new ResizeObserver') && !content.includes('.disconnect()')) {
      result.details.push({
        file,
        type: 'resize-observer-leak',
        success: false,
        message: '需要在 destroy 中调用 observer.disconnect()'
      });
      result.skipped++;
    }
    
    return content;
  }
}
