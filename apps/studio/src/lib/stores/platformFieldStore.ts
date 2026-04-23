import { create } from 'zustand';

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
  /** List of fields provided by the platform */
  fields: PlatformFieldItem[];

  /** Completely replace the field definitions */
  setFields: (fields: PlatformFieldItem[]) => void;

  /** Clear all fields */
  clearFields: () => void;
}

export const usePlatformFieldStore = create<PlatformFieldState>((set) => ({
  fields: [],

  setFields: (fields) =>
    set(() => ({
      fields,
    })),

  clearFields: () =>
    set(() => ({
      fields: [],
    })),
}));

/**
 * Non-React helper for accessing/mutating fields from outside component trees.
 */
export const platformFieldStore = {
  getFields: () => usePlatformFieldStore.getState().fields,
  setFields: (fields: PlatformFieldItem[]) => usePlatformFieldStore.getState().setFields(fields),
  clearFields: () => usePlatformFieldStore.getState().clearFields(),
};
