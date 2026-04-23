import type { I18nLabel } from '@thingsvis/schema';

export type EmbeddedFieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export type EmbeddedFieldDef = {
  id: string;
  label: I18nLabel;
  type: EmbeddedFieldType;
};

export type EmbeddedRuntimeDeviceFieldDef = EmbeddedFieldDef & {
  alias?: I18nLabel;
};

export type EmbeddedDataSourceGroup = 'dashboard' | 'current-device' | 'current-device-history';

export type EmbeddedDataSourceDef = {
  id: string;
  group: EmbeddedDataSourceGroup;
  label: I18nLabel;
  url: string;
  params?: Record<string, unknown>;
  fields: EmbeddedFieldDef[];
  transformation: string;
};

export type EmbeddedProviderCatalog = {
  provider: string;
  runtimeDeviceFields?: EmbeddedRuntimeDeviceFieldDef[];
  dataSources: EmbeddedDataSourceDef[];
};
