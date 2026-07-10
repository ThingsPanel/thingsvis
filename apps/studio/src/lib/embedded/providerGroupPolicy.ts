import type { EmbeddedDataSourceGroup } from './embedded-data-source';
import type { EmbeddedEditorContext } from './service-config';

export function getDataSourceProviderGroups(
  context: EmbeddedEditorContext | undefined,
): EmbeddedDataSourceGroup[] | undefined {
  if (context === 'dashboard') return ['dashboard'];
  if (context === 'device-template') return ['current-device', 'current-device-history'];
  return undefined;
}

export function isFieldPickerProviderGroupVisible(
  context: EmbeddedEditorContext | undefined,
  group: EmbeddedDataSourceGroup,
): boolean {
  if (context === 'dashboard') return group === 'dashboard';
  // device-template：字段选择器暴露全部 group（含 dashboard 系统数据）；其他上下文同样全开
  return true;
}
