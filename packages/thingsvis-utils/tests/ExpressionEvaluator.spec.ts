import { describe, expect, it } from 'vitest';
import { ExpressionEvaluator } from '../src/ExpressionEvaluator';

describe('ExpressionEvaluator 含点扁平键', () => {
  const context = {
    ds: {
      dev: {
        data: {
          'A_3.Status_S': '正常',
          a: { b: 1 },
        },
      },
    },
  };

  it('旧点分路径靠最长匹配命中扁平键', () => {
    expect(
      ExpressionEvaluator.evaluate('{{ ds.dev.data.A_3.Status_S }}', context),
    ).toBe('正常');
  });

  it('括号编码路径可求值', () => {
    expect(
      ExpressionEvaluator.evaluate('{{ ds.dev.data["A_3.Status_S"] }}', context),
    ).toBe('正常');
  });

  it('普通嵌套路径仍按段解析', () => {
    expect(ExpressionEvaluator.evaluate('{{ ds.dev.data.a.b }}', context)).toBe(1);
  });

  it('同时存在扁平键与嵌套时优先扁平整键', () => {
    const both = {
      ds: {
        dev: {
          data: {
            'a.b': 'flat',
            a: { b: 'nested' },
          },
        },
      },
    };
    expect(ExpressionEvaluator.evaluate('{{ ds.dev.data.a.b }}', both)).toBe('flat');
  });
});
