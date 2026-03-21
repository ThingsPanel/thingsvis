import { describe, expect, it } from 'vitest';
import { orderNodeStatesByLayerOrder } from './layerOrder';

describe('orderNodeStatesByLayerOrder', () => {
  it('returns nodes in layer order and appends missing entries without dropping them', () => {
    const nodeA = { id: 'a' } as any;
    const nodeB = { id: 'b' } as any;
    const nodeC = { id: 'c' } as any;

    const ordered = orderNodeStatesByLayerOrder(
      {
        a: nodeA,
        b: nodeB,
        c: nodeC,
      },
      ['b', 'a'],
    );

    expect(ordered).toEqual([nodeB, nodeA, nodeC]);
  });
});
