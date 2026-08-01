import type { ActionConfigItem } from './ActionConfigEditor';

export const TEMPLATE_DEVICE_DATA_SOURCE_ID = '__platform___template____';
const LEGACY_PLATFORM_DATA_SOURCE_ID = '__platform__';

export function getActionDataSourceIds(
  runtimeIds: string[],
  configuredIds: string[],
  isDeviceTemplate: boolean,
): string[] {
  return Array.from(
    new Set([
      ...(isDeviceTemplate ? [TEMPLATE_DEVICE_DATA_SOURCE_ID] : []),
      ...configuredIds,
      ...runtimeIds,
    ]),
  );
}

export function normalizeDeviceTemplateWriteActions(
  actions: ActionConfigItem[],
): ActionConfigItem[] {
  let changed = false;
  const next = actions.map((action) => {
    if (
      action.type !== 'callWrite' ||
      (action.dataSourceId && action.dataSourceId !== LEGACY_PLATFORM_DATA_SOURCE_ID)
    ) {
      return action;
    }
    changed = true;
    return { ...action, dataSourceId: TEMPLATE_DEVICE_DATA_SOURCE_ID };
  });
  return changed ? next : actions;
}
