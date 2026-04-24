import { describe, expect, it } from 'vitest';
import {
  collectSetVariableDefinitions,
  createVariableDefinition,
  mergeActionVariableDefinitions,
} from './eventVariables';

describe('event variable helpers', () => {
  it('creates missing page variables from setVariable event actions', () => {
    const nodes = [
      {
        events: [
          {
            event: 'change',
            actions: [
              { type: 'setVariable', variableName: 'temp_input', value: 'Number(payload)' },
              { type: 'callWrite', dataSourceId: 'device-control' },
            ],
          },
        ],
      },
    ];

    expect(collectSetVariableDefinitions(nodes)).toEqual([
      { name: 'temp_input', type: 'number', defaultValue: 0 },
    ]);
  });

  it('does not duplicate existing variable definitions', () => {
    const merged = mergeActionVariableDefinitions(
      [{ name: 'temp_input', type: 'string', defaultValue: '' }],
      [
        {
          events: [
            {
              event: 'change',
              actions: [{ type: 'setVariable', variableName: 'temp_input', value: 'payload' }],
            },
          ],
        },
      ],
    );

    expect(merged).toEqual([{ name: 'temp_input', type: 'string', defaultValue: '' }]);
  });

  it('ignores invalid variable names', () => {
    expect(createVariableDefinition('bad-name', 'payload')).toBeNull();
    expect(createVariableDefinition('1bad', 'payload')).toBeNull();
  });
});
