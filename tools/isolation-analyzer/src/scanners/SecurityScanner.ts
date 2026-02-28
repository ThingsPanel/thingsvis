import type { Issue } from '../IsolationAnalyzer';

export class SecurityScanner {
  async scan(filePath: string, content: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // 检测 innerHTML 使用
      if (line.includes('innerHTML') && !line.includes('textContent') && !line.includes('DOMPurify')) {
        // 检查是否有 DOMPurify 或转义
        const context = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
        
        if (!context.includes('DOMPurify') && !context.includes('sanitize')) {
          issues.push({
            id: `xss-innerHTML-${filePath}-${lineNumber}`,
            severity: 'error',
            category: 'security',
            description: '检测到未过滤的 innerHTML 使用，存在 XSS 风险',
            location: { file: filePath, line: lineNumber, column: line.indexOf('innerHTML') },
            code: line.trim(),
            fix: '使用 DOMPurify.sanitize() 或替换为 textContent',
            autoFixable: true
          });
        }
      }
      
      // 检测 eval / new Function
      if (/\beval\s*\(/.test(line) || /new\s+Function\s*\(/.test(line)) {
        issues.push({
          id: `code-injection-${filePath}-${lineNumber}`,
          severity: 'error',
          category: 'security',
          description: '检测到动态代码执行，可能导致代码注入',
          location: { file: filePath, line: lineNumber, column: 0 },
          code: line.trim(),
          fix: '使用安全的表达式解析库替代 eval',
          autoFixable: false
        });
      }
      
      // 检测危险的全局变量访问
      if (line.includes('localStorage') && line.includes('+')) {
        issues.push({
          id: `data-exposure-${filePath}-${lineNumber}`,
          severity: 'warning',
          category: 'security',
          description: 'localStorage 数据可能与外部数据拼接，存在泄露风险',
          location: { file: filePath, line: lineNumber, column: 0 },
          code: line.trim(),
          fix: '避免将敏感数据与外部输入拼接',
          autoFixable: false
        });
      }
    }
    
    return issues;
  }
}
