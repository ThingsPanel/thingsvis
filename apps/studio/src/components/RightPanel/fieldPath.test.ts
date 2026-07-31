import { describe, expect, it } from 'vitest';
import { listFieldPaths, resolveFieldPath } from './fieldPath';

describe('fieldPath 含点扁平键', () => {
  it('resolveFieldPath 命中扁平整键 A_3.Status_S', () => {
    const data = { 'A_3.Status_S': '正常', temperature: 24 };
    expect(resolveFieldPath(data, 'A_3.Status_S')).toBe('正常');
    expect(resolveFieldPath(data, 'temperature')).toBe(24);
  });

  it('普通嵌套路径仍可用', () => {
    const data = { a: { b: 1 } };
    expect(resolveFieldPath(data, 'a.b')).toBe(1);
  });

  it('同时存在扁平键与嵌套时优先扁平键', () => {
    const data = { 'a.b': 'flat', a: { b: 'nested' } };
    expect(resolveFieldPath(data, 'a.b')).toBe('flat');
  });

  it('listFieldPaths 对扁平含点键输出整键', () => {
    const { paths } = listFieldPaths({ 'A_3.Status_S': '正常' });
    expect(paths).toContain('A_3.Status_S');
  });
});
