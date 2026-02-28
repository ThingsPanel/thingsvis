import type { Issue } from '../IsolationAnalyzer';

export class IsolationScanner {
  async scan(filePath: string, content: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const lines = content.split('\n');
    
    // 只扫描 Widget 文件
    if (!filePath.includes('widgets/')) {
      return issues;
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // 检测是否使用了 defineWidget
      if (line.includes('defineWidget')) {
        // 检查是否配置了 isolation
        const context = lines.slice(i, Math.min(lines.length, i + 50)).join('\n');
        
        if (!context.includes('isolation:') && !context.includes('shadowDOM')) {
          issues.push({
            id: `missing-isolation-${filePath}`,
            severity: 'error',
            category: 'isolation',
            description: 'Widget 未配置隔离级别，可能导致样式/行为污染',
            location: { file: filePath, line: lineNumber, column: 0 },
            code: 'defineWidget({ ... })',
            fix: '添加 isolation: "shadow-dom" 配置',
            autoFixable: true
          });
        }
      }
      
      // 检测直接访问 store
      if (line.includes('useNodeStore') || line.includes('kernelStore')) {
        if (filePath.includes('widgets/')) {
          issues.push({
            id: `direct-store-access-${filePath}-${lineNumber}`,
            severity: 'error',
            category: 'isolation',
            description: 'Widget 直接访问全局 store，违反隔离原则',
            location: { file: filePath, line: lineNumber, column: 0 },
            code: line.trim(),
            fix: '通过 props 和事件与宿主通信',
            autoFixable: false
          });
        }
      }
      
      // 检测 ResizeObserver 未清理
      if (line.includes('new ResizeObserver')) {
        const context = content;
        if (!context.includes('disconnect()') && !context.includes('unobserve')) {
          issues.push({
            id: `resize-observer-leak-${filePath}-${lineNumber}`,
            severity: 'warning',
            category: 'isolation',
            description: 'ResizeObserver 可能未在 destroy 中清理，导致内存泄漏',
            location: { file: filePath, line: lineNumber, column: 0 },
            code: line.trim(),
            fix: '在 destroy 方法中调用 observer.disconnect()',
            autoFixable: true
          });
        }
      }
    }
    
    return issues;
  }
}
