import { readFile } from 'fs/promises';
import { glob } from 'glob';
import type { Issue } from '../IsolationAnalyzer';

export class DependencyScanner {
  async scan(filePath: string, content: string): Promise<Issue[]> {
    return []; // 依赖扫描在 scanPackages 中处理
  }
  
  async scanPackages(projectPath: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // 获取所有 package.json
    const packageFiles = await glob('**/package.json', {
      cwd: projectPath,
      ignore: ['node_modules/**']
    });
    
    const packages: Array<{ path: string; json: any }> = [];
    
    for (const file of packageFiles) {
      try {
        const content = await readFile(`${projectPath}/${file}`, 'utf-8');
        packages.push({ path: file, json: JSON.parse(content) });
      } catch (e) {
        // 忽略解析错误
      }
    }
    
    // 检查 React 版本一致性
    const reactVersions = new Map<string, string[]>();
    for (const pkg of packages) {
      const reactVersion = pkg.json.dependencies?.react || pkg.json.peerDependencies?.react;
      if (reactVersion) {
        if (!reactVersions.has(reactVersion)) {
          reactVersions.set(reactVersion, []);
        }
        reactVersions.get(reactVersion)!.push(pkg.path);
      }
    }
    
    if (reactVersions.size > 1) {
      const versions = Array.from(reactVersions.entries());
      issues.push({
        id: 'react-version-mismatch',
        severity: 'error',
        category: 'dependency',
        description: `React 版本不一致: ${versions.map(v => v[0]).join(', ')}`,
        location: { file: 'package.json', line: 1, column: 0 },
        code: versions.map(([ver, files]) => `${ver}: ${files.join(', ')}`).join('\n'),
        fix: '在 root package.json 中使用 pnpm.overrides 统一版本',
        autoFixable: true
      });
    }
    
    // 检查 @module-federation 版本一致性
    const mfPackages = ['@module-federation/enhanced', '@module-federation/runtime'];
    for (const mfPkg of mfPackages) {
      const versions = new Map<string, string[]>();
      for (const pkg of packages) {
        const ver = pkg.json.dependencies?.[mfPkg];
        if (ver) {
          if (!versions.has(ver)) {
            versions.set(ver, []);
          }
          versions.get(ver)!.push(pkg.path);
        }
      }
      
      if (versions.size > 1) {
        issues.push({
          id: `mf-version-mismatch-${mfPkg}`,
          severity: 'warning',
          category: 'dependency',
          description: `${mfPkg} 版本不一致`,
          location: { file: 'package.json', line: 1, column: 0 },
          code: Array.from(versions.entries()).map(([v, f]) => `${v}: ${f.join(', ')}`).join('\n'),
          fix: '统一 Module Federation 相关包版本',
          autoFixable: true
        });
      }
    }
    
    // 检查 Widget 是否缺少 SDK 依赖
    const widgetPackages = packages.filter(p => p.path.includes('widgets/'));
    for (const pkg of widgetPackages) {
      const hasSdk = pkg.json.dependencies?.['@thingsvis/widget-sdk'] || 
                     pkg.json.peerDependencies?.['@thingsvis/widget-sdk'];
      if (!hasSdk) {
        issues.push({
          id: `missing-sdk-${pkg.path}`,
          severity: 'error',
          category: 'dependency',
          description: `Widget ${pkg.json.name} 缺少 @thingsvis/widget-sdk 依赖`,
          location: { file: pkg.path, line: 1, column: 0 },
          code: JSON.stringify(pkg.json.dependencies, null, 2),
          fix: '添加 "@thingsvis/widget-sdk": "workspace:*" 到 dependencies',
          autoFixable: true
        });
      }
    }
    
    return issues;
  }
}
