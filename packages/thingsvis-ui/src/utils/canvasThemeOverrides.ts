import type { CSSProperties } from 'react';
import type { CanvasThemeOverrides } from '@thingsvis/schema';


/** Public semantic token → CSS custom property mapping. */
const TOKEN_TO_CSS_VAR: Record<keyof CanvasThemeOverrides, string> = {
  bg: '--w-bg',
  surface: '--w-surface',
  surfaceBorder: '--w-surface-border',
  surfaceShadow: '--w-surface-shadow',
  fg: '--w-fg',
  textPrimary: '--w-text-primary',
  textSecondary: '--w-text-secondary',
  textMuted: '--w-text-muted',
  axis: '--w-axis',
  primary: '--w-primary',
  border: '--w-border',
  series1: '--w-series-1',
  series2: '--w-series-2',
  series3: '--w-series-3',
  series4: '--w-series-4',
  series5: '--w-series-5',
  series6: '--w-series-6',
  statusOnline: '--w-status-online',
  statusWarning: '--w-status-warning',
  statusOffline: '--w-status-offline',
  statusMaintenance: '--w-status-maintenance',
  statusCritical: '--w-status-critical',
  statusInfo: '--w-status-info',
  statusSuccess: '--w-status-success',
};

/** Reject declaration-like values before placing configuration into inline CSS. */
function isSafeTokenValue(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !/[;{}]/.test(value) &&
    !/url\s*\(|expression\s*\(/i.test(value)
  );
}

export function createCanvasThemeOverrideStyle(input: unknown): CSSProperties {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

  const style: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR)) {
    const value = (input as Record<string, unknown>)[key];
    if (isSafeTokenValue(value)) style[cssVar] = value.trim();
  }
  return style as CSSProperties;
}

export function normalizeCanvasThemeOverrides(input: unknown): CanvasThemeOverrides | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const next: Record<string, string> = {};
  for (const key of Object.keys(TOKEN_TO_CSS_VAR)) {
    const value = (input as Record<string, unknown>)[key];
    if (isSafeTokenValue(value)) next[key] = value.trim();
  }
  return Object.keys(next).length > 0 ? (next as CanvasThemeOverrides) : undefined;
}
