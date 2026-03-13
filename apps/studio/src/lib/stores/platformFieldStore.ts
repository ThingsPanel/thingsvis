import { create } from 'zustand';
import {
  getDefaultAggregatePlatformFields,
  mergeWithDefaultAggregatePlatformFields,
  type PlatformFieldScope,
} from '../embedded/default-platform-fields';

// =============================================================================
// Platform Field Store
// =============================================================================

export interface PlatformFieldItem {
  id: string;
  name: string;
  alias?: string;
  type?: 'number' | 'string' | 'boolean' | 'json' | string;
  dataType?: 'attribute' | 'telemetry' | 'command' | 'event' | string;
  unit?: string;
  description?: string;
  [key: string]: unknown;
}

interface PlatformFieldState {
  /** Active role scope used to expose aggregate defaults */
  scope: PlatformFieldScope;

  /** List of fields provided by the platform */
  fields: PlatformFieldItem[];

  /** Host-provided fields without built-in aggregate defaults */
  customFields: PlatformFieldItem[];

  /** Completely replace the field definitions */
  setFields: (fields: PlatformFieldItem[]) => void;

  /** Update role scope and rebuild the effective field list */
  setScope: (scope: PlatformFieldScope) => void;

  /** Clear all fields */
  clearFields: () => void;
}

export const usePlatformFieldStore = create<PlatformFieldState>((set) => ({
  scope: 'all',
  customFields: [],
  fields: getDefaultAggregatePlatformFields('all') as PlatformFieldItem[],

  setFields: (fields) =>
    set((state) => ({
      customFields: fields,
      fields: mergeWithDefaultAggregatePlatformFields(fields, state.scope) as PlatformFieldItem[],
    })),

  setScope: (scope) =>
    set((state) => ({
      scope,
      fields: mergeWithDefaultAggregatePlatformFields(
        state.customFields,
        scope,
      ) as PlatformFieldItem[],
    })),

  clearFields: () =>
    set((state) => ({
      customFields: [],
      fields: getDefaultAggregatePlatformFields(state.scope) as PlatformFieldItem[],
    })),
}));

/**
 * Non-React helper for accessing/mutating fields from outside component trees.
 */
export const platformFieldStore = {
  getFields: () => usePlatformFieldStore.getState().fields,
  getScope: () => usePlatformFieldStore.getState().scope,
  setFields: (fields: PlatformFieldItem[]) => usePlatformFieldStore.getState().setFields(fields),
  setScope: (scope: PlatformFieldScope) => usePlatformFieldStore.getState().setScope(scope),
  clearFields: () => usePlatformFieldStore.getState().clearFields(),
};
