import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions } from '../types';
import type { DashboardVariable } from '../../variables/types';

// ---------------------------------------------------------------------------
// URL persistence helpers (TASK-23)
// Variables with persistent:true are synced to URL search params so they
// survive page refresh. All helpers are browser-safe (guard on window).
// ---------------------------------------------------------------------------

/** Read a URL param value and coerce to the variable's declared type. */
function readUrlParam(name: string, type: DashboardVariable['type']): unknown | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = new URLSearchParams(window.location.search).get(`var_${name}`);
  if (raw === null) return undefined;
  try {
    switch (type) {
      case 'number':
        return Number(raw);
      case 'boolean':
        return raw === 'true';
      case 'object':
      case 'array':
        return JSON.parse(raw);
      default:
        return raw; // string
    }
  } catch {
    return raw;
  }
}

/** Write (or remove) a URL param without triggering a page reload. */
function writeUrlParam(name: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const paramName = `var_${name}`;
  if (value === undefined || value === null) {
    params.delete(paramName);
  } else {
    params.set(paramName, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  const newSearch = params.toString();
  const newUrl = newSearch
    ? `${window.location.pathname}?${newSearch}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState(null, '', newUrl);
}

export type VariableSliceState = {
  variableDefinitions: DashboardVariable[];
  variableValues: Record<string, unknown>;
};

export type VariableSliceActions = Pick<
  KernelActions,
  'setVariableDefinitions' | 'initVariablesFromDefinitions' | 'setVariableValue'
>;

export type VariableSlice = VariableSliceState & VariableSliceActions;

export const createVariableSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  VariableSlice
> = (set, get) => ({
  variableDefinitions: [],
  variableValues: {},

  setVariableDefinitions: (defs) => {
    set((state) => {
      state.variableDefinitions = defs;
    });
  },

  initVariablesFromDefinitions: (defs) => {
    set((state) => {
      const next: Record<string, unknown> = { ...state.variableValues };
      defs.forEach((def) => {
        if (def.persistent) {
          // URL param takes priority over default (restores state across refresh)
          const urlVal = readUrlParam(def.name, def.type);
          if (urlVal !== undefined) {
            next[def.name] = urlVal;
            return;
          }
        }
        // Only set default if value not already present
        if (!(def.name in next)) {
          next[def.name] = def.defaultValue;
        }
      });
      state.variableValues = next;
    });
  },

  setVariableValue: (name, value) => {
    set((state) => {
      state.variableValues[name] = value;
    });
    // After updating state, persist to URL if the variable is marked persistent
    const def = get().variableDefinitions.find((d) => d.name === name);
    if (def?.persistent) {
      writeUrlParam(name, value);
    }
  },
});
