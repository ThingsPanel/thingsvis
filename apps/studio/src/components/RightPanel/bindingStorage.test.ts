import { describe, expect, it } from 'vitest';
import {
  decodeFieldPathAccess,
  encodeFieldPathAccess,
  makeFieldBindingExpression,
  parseFieldBindingExpression,
} from './bindingStorage';

describe('bindingStorage 含点字段路径', () => {
  it('make/parse 往返保留 A_3.Status_S（点分，依赖运行时最长匹配）', () => {
    const expression = makeFieldBindingExpression({
      dataSourceId: 'dev',
      fieldPath: 'A_3.Status_S',
    });
    expect(expression).toBe('{{ ds.dev.data.A_3.Status_S }}');
    expect(parseFieldBindingExpression(expression)).toEqual({
      dataSourceId: 'dev',
      fieldPath: 'A_3.Status_S',
    });
  });

  it('嵌套路径 location.lat 保持点分而非整键括号', () => {
    const expression = makeFieldBindingExpression({
      dataSourceId: 'dev',
      fieldPath: 'location.lat',
    });
    expect(expression).toBe('{{ ds.dev.data.location.lat }}');
    expect(encodeFieldPathAccess('location.lat')).toBe('.location.lat');
    expect(parseFieldBindingExpression(expression)).toEqual({
      dataSourceId: 'dev',
      fieldPath: 'location.lat',
    });
  });

  it('解析旧点分形式', () => {
    expect(parseFieldBindingExpression('{{ ds.dev.data.A_3.Status_S }}')).toEqual({
      dataSourceId: 'dev',
      fieldPath: 'A_3.Status_S',
    });
  });

  it('解析括号形式（兼容已保存/手写表达式）', () => {
    expect(parseFieldBindingExpression('{{ ds.dev.data["A_3.Status_S"] }}')).toEqual({
      dataSourceId: 'dev',
      fieldPath: 'A_3.Status_S',
    });
    expect(parseFieldBindingExpression("{{ ds.dev.data['A_3.Status_S'] }}")).toEqual({
      dataSourceId: 'dev',
      fieldPath: 'A_3.Status_S',
    });
  });

  it('普通安全字段仍用点分', () => {
    expect(makeFieldBindingExpression({ dataSourceId: 'dev', fieldPath: 'temperature' })).toBe(
      '{{ ds.dev.data.temperature }}',
    );
  });

  it('结构路径 items[].name 按段编码且可往返', () => {
    const expression = makeFieldBindingExpression({
      dataSourceId: 'dev',
      fieldPath: 'items[].name',
    });
    expect(expression).toBe('{{ ds.dev.data.items[].name }}');
    expect(parseFieldBindingExpression(expression)).toEqual({
      dataSourceId: 'dev',
      fieldPath: 'items[].name',
    });
  });

  it('不安全单段使用括号编码', () => {
    expect(encodeFieldPathAccess('foo-bar')).toBe('["foo-bar"]');
    expect(makeFieldBindingExpression({ dataSourceId: 'dev', fieldPath: 'foo-bar' })).toBe(
      '{{ ds.dev.data["foo-bar"] }}',
    );
    expect(parseFieldBindingExpression('{{ ds.dev.data["foo-bar"] }}')).toEqual({
      dataSourceId: 'dev',
      fieldPath: 'foo-bar',
    });
  });

  it('encode/decode 工具与 make 一致', () => {
    expect(encodeFieldPathAccess('A_3.Status_S')).toBe('.A_3.Status_S');
    expect(decodeFieldPathAccess('.A_3.Status_S')).toBe('A_3.Status_S');
    expect(decodeFieldPathAccess('["A_3.Status_S"]')).toBe('A_3.Status_S');
  });
});
