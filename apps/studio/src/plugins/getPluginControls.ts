import type { PluginMainModule, PluginControls } from '@thingsvis/schema';
import { PluginControlsSchema } from '@thingsvis/schema';

export type PluginControlsParseResult = {
  controls: PluginControls | null;
  issues?: string[];
};

export function getPluginControls(entry: PluginMainModule | null | undefined): PluginControlsParseResult {
  const raw = entry?.controls;
  if (!raw) return { controls: null };

  const parsed = PluginControlsSchema.safeParse(raw);
  if (parsed.success) return { controls: parsed.data };

  return {
    controls: null,
    issues: parsed.error.issues.map(issue => {
      const path = issue.path.length ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    })
  };
}
