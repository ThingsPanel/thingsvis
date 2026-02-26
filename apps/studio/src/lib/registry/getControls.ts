import type { WidgetMainModule, WidgetControls } from '@thingsvis/schema';
import { WidgetControlsSchema } from '@thingsvis/schema';

export type ControlsParseResult = {
    controls: WidgetControls | null;
    issues?: string[];
};

export function getControls(entry: WidgetMainModule | null | undefined): ControlsParseResult {
    const raw = entry?.controls;
    if (!raw) return { controls: null };

    const parsed = WidgetControlsSchema.safeParse(raw);
    if (parsed.success) return { controls: parsed.data };

    return {
        controls: null,
        issues: parsed.error.issues.map(issue => {
            const path = issue.path.length ? issue.path.join('.') : '(root)';
            return `${path}: ${issue.message}`;
        })
    };
}

// Alias for backward compatibility
export const getWidgetControls = getControls;
export type WidgetControlsParseResult = ControlsParseResult;
