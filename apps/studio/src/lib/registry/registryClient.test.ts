import { describe, expect, it } from 'vitest';
import { toRegistryEntries } from './registryClient';

describe('registryClient', () => {
  it('sorts registry entries by order and leaves unordered entries last', () => {
    const entries = toRegistryEntries({
      schemaVersion: 1,
      generatedAt: '2026-03-22T00:00:00.000Z',
      components: {
        'basic/text': {
          remoteName: 'basic_text',
          remoteEntryUrl: '',
          exposedModule: './Main',
          version: '1.0.0',
          order: 3,
          name: 'Text',
        },
        'basic/rectangle': {
          remoteName: 'basic_rectangle',
          remoteEntryUrl: '',
          exposedModule: './Main',
          version: '1.0.0',
          order: 1,
          name: 'Rectangle',
        },
        'basic/circle': {
          remoteName: 'basic_circle',
          remoteEntryUrl: '',
          exposedModule: './Main',
          version: '1.0.0',
          order: 2,
          name: 'Circle',
        },
        'interaction/basic-button': {
          remoteName: 'interaction_button',
          remoteEntryUrl: '',
          exposedModule: './Main',
          version: '1.0.0',
          name: 'Button',
        },
      },
    });

    expect(entries.map((entry) => entry.componentId)).toEqual([
      'basic/rectangle',
      'basic/circle',
      'basic/text',
      'interaction/basic-button',
    ]);
  });
});
