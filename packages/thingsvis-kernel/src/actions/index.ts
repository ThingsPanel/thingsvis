/**
 * Action execution engine for ThingsVis widget events.
 */
import type { DashboardVariable } from '../variables/types';

// ---------------------------------------------------------------------------
// Action type union
// ---------------------------------------------------------------------------

export interface SetVariableAction {
  type: 'setVariable';
  variableName: string;
  value: unknown;
}

export interface CallWriteAction {
  type: 'callWrite';
  dataSourceId: string;
  /** JSON-serialisable payload sent to the data source write endpoint */
  payload?: unknown;
}

export interface NavigateAction {
  type: 'navigate';
  url: string;
  /** Open in new tab */
  blank?: boolean;
}

export interface RunScriptAction {
  type: 'runScript';
  script: string;
}

export type ActionConfig =
  | SetVariableAction
  | CallWriteAction
  | NavigateAction
  | RunScriptAction;

// ---------------------------------------------------------------------------
// Context & store interfaces
// ---------------------------------------------------------------------------

/** Minimal interface for the variable store needed by executeActions */
export interface ActionStore {
  setVariable: (name: string, value: unknown) => void;
  getVariable: (name: string) => unknown;
  variableDefinitions: DashboardVariable[];
}

/** Minimal interface for the data-source manager needed by executeActions */
export interface ActionDataSourceManager {
  write?: (id: string, payload: unknown) => Promise<void>;
}

export interface ActionContext {
  store?: ActionStore;
  dsManager?: ActionDataSourceManager;
  /** Optional event payload passed from the triggering widget */
  eventPayload?: unknown;
}

// ---------------------------------------------------------------------------
// Runtime executor
// ---------------------------------------------------------------------------

export async function executeActions(
  actions: ActionConfig[],
  context: ActionContext,
): Promise<void> {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'setVariable':
          context.store?.setVariable(action.variableName, action.value);
          break;

        case 'callWrite':
          await context.dsManager?.write?.(action.dataSourceId, action.payload ?? {});
          break;

        case 'navigate':
          if (typeof window !== 'undefined') {
            if (action.blank) {
              window.open(action.url, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = action.url;
            }
          }
          break;

        case 'runScript':
          // eslint-disable-next-line no-new-func
          await new Function('context', `"use strict"; return (async () => { ${action.script} })()`)(context);
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('[executeActions] action failed:', action, err);
    }
  }
}
