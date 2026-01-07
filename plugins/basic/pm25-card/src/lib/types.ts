import type { z } from 'zod';

export type BindingMode = 'static' | 'field' | 'expr' | 'rule';
export type ControlKind = 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json';

export type ControlBinding = {
  enabled: boolean;
  modes: BindingMode[];
};

export type ControlField = {
  path: string;
  label: string;
  kind: ControlKind;
  default?: unknown;
  binding?: ControlBinding;
};

export type ControlGroup = {
  id: 'Content' | 'Style' | 'Data' | 'Advanced';
  label?: string;
  fields: ControlField[];
};

export type PluginControls = {
  groups: ControlGroup[];
};

export type PluginOverlayContext = {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  props?: Record<string, unknown>;
};

export type PluginOverlayInstance = {
  element: HTMLElement;
  update?: (ctx: PluginOverlayContext) => void;
  destroy?: () => void;
};

export type PluginMainModule = {
  id: string;
  name?: string;
  category?: string;
  icon?: string;
  version?: string;
  resizable?: boolean;
  create?: () => unknown;
  schema?: z.ZodType<unknown>;
  controls?: PluginControls;
  createOverlay?: (ctx: PluginOverlayContext) => PluginOverlayInstance;
};
