import type { Issue } from '../IsolationAnalyzer';

export class PerformanceScanner {
  async scan(filePath: string, content: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // 检测 useSyncExternalStore 订阅整个状态
      if (line.includes('useSyncExternalStore') && line.includes('getState()')) {
        if (!content.includes('selector') && !content.includes('shallow')) {
          issues.push({
            id: `full-state-subscription-${filePath}-${lineNumber}`,
            severity: 'warning',
            category: 'performance',
            description: '订阅整个状态树可能导致不必要的重渲染',
            location: { file: filePath, line: lineNumber, column: 0 },
            code: line.trim(),
            fix: '使用 selector 函数只订阅需要的字段',
            autoFixable: false
          });
        }
      }
      
      // 检测 JSON.stringify 大数据
      if (line.includes('JSON.stringify') && !line.includes('try')) {
        issues.push({
          id: `json-stringify-perf-${filePath}-${lineNumber}`,
          severity: 'info',
          category: 'performance',
          description: 'JSON.stringify 可能在大数据量时造成性能问题',
          location: { file: filePath, line: lineNumber, column: 0 },
          code: line.trim(),
          fix: '考虑使用 Web Worker 或分片处理',
          autoFixable: false
        });
      }
      
      // 检测循环中的状态更新
      if (/for\s*\(|while\s*\(/.test(line)) {
        const nextLines = lines.slice(i, i + 10).join('\n');
        if (nextLines.includes('setState') || nextLines.includes('updateNode')) {
          issues.push({
            id: `loop-state-update-${filePath}-${lineNumber}`,
            severity: 'warning',
            category: 'performance',
            description: '循环中更新状态可能导致多次重渲染',
            location: { file: filePath, line: lineNumber, column: 0 },
            code: line.trim(),
            fix: '批量更新或使用 transaction',
            autoFixable: false
          });
        }
      }
    }
    
    return issues;
  }
}
