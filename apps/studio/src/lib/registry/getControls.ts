import type { WidgetMainModule, WidgetControls } from '@thingsvis/schema';
import { WidgetControlsSchema, BASE_STYLE_MANAGED_PATHS } from '@thingsvis/schema';

export type ControlsParseResult = {
  controls: WidgetControls | null;
  issues?: string[];
};

/**
 * Strip fields whose path collides with BaseStylePanel-managed properties.
 * Returns a new WidgetControls with conflicting fields removed and empty
 * groups pruned.  Emits a dev-only console warning for each filtered path.
 */
function filterBaseStylePaths(controls: WidgetControls): WidgetControls {
  const filtered = controls.groups
    .map((group) => {
      const fields = group.fields.filter((f) => {
        if (BASE_STYLE_MANAGED_PATHS.has(f.path)) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(
              `[getControls] Widget defines base-style-managed path "${f.path}" in controls. It will be hidden. Please remove it from the widget's controls.ts.`,
            );
          }
          return false;
        }
        return true;
      });
      return { ...group, fields };
    })
    .filter((group) => group.fields.length > 0);
  return { groups: filtered };
}

export function getControls(entry: WidgetMainModule | null | undefined): ControlsParseResult {
  const raw = entry?.controls;
  if (!raw) return { controls: null };

  const parsed = WidgetControlsSchema.safeParse(raw);
  if (parsed.success) return { controls: filterBaseStylePaths(parsed.data) };

  return {
    controls: null,
    issues: parsed.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    }),
  };
}

// Alias for backward compatibility
export const getWidgetControls = getControls;
export type WidgetControlsParseResult = ControlsParseResult;
