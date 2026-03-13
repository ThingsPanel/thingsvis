/**
 * Global variable system types for ThingsVis dashboards.
 */

export type VariableValueType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface DashboardVariable {
  /** Unique variable name (used as key in variable store) */
  name: string;
  /** Runtime value type */
  type: VariableValueType;
  /** Default value applied on init / reset */
  defaultValue: unknown;
  /** Optional human-readable label */
  label?: string;
  /** Persist across sessions (localStorage) */
  persistent?: boolean;
}

export type DashboardVariableList = DashboardVariable[];
