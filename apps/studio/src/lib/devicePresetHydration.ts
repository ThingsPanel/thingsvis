import type { DataSource, PlatformFieldConfig } from '@thingsvis/schema';
import {
  getPlatformDeviceDataSourceId,
  isPlatformFieldDataSource,
  normalizePlatformBufferSize,
} from '@/embed/platformDeviceCompat';

export type DevicePresetSchema = {
  canvas?: Record<string, unknown>;
  nodes?: Array<Record<string, unknown>>;
  dataSources?: unknown[];
};

const GENERIC_PLATFORM_DATA_SOURCE_ID = '__device_platform_template__';
const TEMPLATE_DEVICE_ID = '__template__';
const TEMPLATE_PLATFORM_DATA_SOURCE_ID = getPlatformDeviceDataSourceId(TEMPLATE_DEVICE_ID);
const TEMPLATE_PLATFORM_BINDING_RE =
  /\bds\.(?:__device_platform_template__|__platform___template____)(?=\.data\b)/g;
const AUTO_WRITE_MARKER = 'field-binding';
const AUTO_WRITE_VALUE_TYPE_KEY = '__thingsvisAutoWriteValueType';
const FIELD_BINDING_EXPR_RE = /\{\{\s*ds\.[^.\s}]+\.data(?:\.([^}]+?))?\s*\}\}/g;
const CAMERA_COMMAND_PROP_BY_EVENT: Record<string, string> = {
  ptzMove: 'ptzMoveCommand',
  ptzStop: 'ptzStopCommand',
  ptzZoom: 'ptzZoomCommand',
  ptzFocus: 'ptzFocusCommand',
  presetGoto: 'presetGotoCommand',
  snapshot: 'snapshotCommand',
  playbackRequest: 'playbackOpenCommand',
};

function cloneValue<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function rewriteBindingString(input: string, targetDataSourceId: string): string {
  if (input === GENERIC_PLATFORM_DATA_SOURCE_ID || input === TEMPLATE_PLATFORM_DATA_SOURCE_ID) {
    return targetDataSourceId;
  }

  return input.replace(TEMPLATE_PLATFORM_BINDING_RE, `ds.${targetDataSourceId}`);
}

function rewriteGenericPlatformBindings<T>(value: T, targetDataSourceId: string): T {
  if (typeof value === 'string') {
    return rewriteBindingString(value, targetDataSourceId) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => rewriteGenericPlatformBindings(entry, targetDataSourceId)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        rewriteGenericPlatformBindings(entry, targetDataSourceId),
      ]),
    ) as T;
  }

  return value;
}

function normalizeRequestedFields(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const requestedFields = value.filter(
    (fieldId): fieldId is string => typeof fieldId === 'string' && fieldId.trim().length > 0,
  );
  return requestedFields.length > 0 ? Array.from(new Set(requestedFields)) : [];
}

function getFieldRoot(fieldPath?: string): string | null {
  if (!fieldPath) return null;
  const [root] = fieldPath.split(/[.[\]\s?:+\-*/=!<>&|(),]/).filter(Boolean);
  return root?.trim() ? root.trim() : null;
}

function extractFirstBoundFieldId(value: unknown): string | null {
  if (typeof value === 'string') {
    FIELD_BINDING_EXPR_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FIELD_BINDING_EXPR_RE.exec(value)) !== null) {
      const fieldId = getFieldRoot(match[1]);
      if (fieldId) return fieldId;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const fieldId = extractFirstBoundFieldId(entry);
      if (fieldId) return fieldId;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      const fieldId = extractFirstBoundFieldId(entry);
      if (fieldId) return fieldId;
    }
  }

  return null;
}

function normalizeAutoWritePayloads<T>(value: T, fieldId: string | null): T {
  if (!fieldId || !value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeAutoWritePayloads(entry, fieldId)) as T;
  }

  const record = value as Record<string, unknown>;
  const isAutoWriteAction =
    record.type === 'callWrite' &&
    record.__thingsvisAutoWrite === AUTO_WRITE_MARKER &&
    typeof record.payload === 'string';
  const autoWriteValueType = record[AUTO_WRITE_VALUE_TYPE_KEY];

  const next = Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [
      key,
      key === 'payload' && isAutoWriteAction
        ? `({ ${JSON.stringify(fieldId)}: ${autoWriteValueType === 'number' ? 'payload ? 1 : 0' : 'payload'} })`
        : normalizeAutoWritePayloads(entry, fieldId),
    ]),
  );

  return next as T;
}

const EZUIKIT_COMMAND_PROP_BY_EVENT: Record<string, string> = {
  playbackRequest: 'playbackCommand',
  liveRequest: 'liveCommand',
};

function normalizeEzuikitPlayerAutoWritePayloads<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeEzuikitPlayerAutoWritePayloads(entry)) as T;
  }

  const record = value as Record<string, unknown>;
  const props =
    record.props && typeof record.props === 'object'
      ? (record.props as Record<string, unknown>)
      : {};
  const next = Object.fromEntries(
    Object.entries(record).map(([key, entry]) => {
      if (key !== 'events' || !Array.isArray(entry)) {
        return [key, normalizeEzuikitPlayerAutoWritePayloads(entry)];
      }

      return [
        key,
        entry.map((handler) => {
          if (!handler || typeof handler !== 'object') return handler;
          const handlerRecord = handler as Record<string, unknown>;
          const eventName = typeof handlerRecord.event === 'string' ? handlerRecord.event : '';
          const commandProp = EZUIKIT_COMMAND_PROP_BY_EVENT[eventName];
          const commandField =
            commandProp && typeof props[commandProp] === 'string'
              ? (props[commandProp] as string).trim()
              : eventName === 'liveRequest'
                ? typeof props.playbackCommand === 'string'
                  ? (props.playbackCommand as string).trim()
                  : 'playback'
                : eventName === 'playbackRequest'
                  ? typeof props.playbackCommand === 'string'
                    ? (props.playbackCommand as string).trim()
                    : 'playback'
                  : '';
          if (!commandField) return handler;

          const actions = Array.isArray(handlerRecord.actions) ? handlerRecord.actions : [];
          const payload =
            eventName === 'liveRequest'
              ? `({ ${JSON.stringify(commandField)}: { type: "live" } })`
              : `({ ${JSON.stringify(commandField)}: payload })`;

          return {
            ...handlerRecord,
            actions: actions.map((action) => {
              if (
                action &&
                typeof action === 'object' &&
                (action as Record<string, unknown>).type === 'callWrite'
              ) {
                return {
                  ...(action as Record<string, unknown>),
                  payload,
                };
              }
              return action;
            }),
          };
        }),
      ];
    }),
  );

  return next as T;
}

function ensureEzuikitDefaultEvents(widget: Record<string, unknown>, dataSourceId: string) {
  if (widget.type !== 'media/ezuikit-player') return widget;

  const props =
    widget.props && typeof widget.props === 'object'
      ? (widget.props as Record<string, unknown>)
      : {};
  const playbackCommand =
    typeof props.playbackCommand === 'string' && props.playbackCommand.trim()
      ? props.playbackCommand.trim()
      : 'playback';
  const events = Array.isArray(widget.events) ? [...widget.events] : [];

  const upsert = (eventName: string, payload: string) => {
    const index = events.findIndex(
      (handler) => (handler as Record<string, unknown>)?.event === eventName,
    );
    const action = { type: 'callWrite', dataSourceId, payload };
    if (index >= 0) {
      const existing = events[index] as Record<string, unknown>;
      const actions = Array.isArray(existing.actions) ? existing.actions : [];
      if (actions.length === 0) {
        events[index] = { ...existing, actions: [action] };
      }
      return;
    }
    events.push({ event: eventName, actions: [action] });
  };

  upsert('playbackRequest', `({ ${JSON.stringify(playbackCommand)}: payload })`);
  upsert('liveRequest', `({ ${JSON.stringify(playbackCommand)}: { type: "live" } })`);

  return { ...widget, events };
}

function normalizeCameraControlAutoWritePayloads<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeCameraControlAutoWritePayloads(entry)) as T;
  }

  const record = value as Record<string, unknown>;
  const props =
    record.props && typeof record.props === 'object'
      ? (record.props as Record<string, unknown>)
      : {};
  const next = Object.fromEntries(
    Object.entries(record).map(([key, entry]) => {
      if (key !== 'events' || !Array.isArray(entry)) {
        return [key, normalizeCameraControlAutoWritePayloads(entry)];
      }

      return [
        key,
        entry.map((handler) => {
          if (!handler || typeof handler !== 'object') return handler;
          const handlerRecord = handler as Record<string, unknown>;
          const eventName = typeof handlerRecord.event === 'string' ? handlerRecord.event : '';
          const commandProp = CAMERA_COMMAND_PROP_BY_EVENT[eventName];
          const commandField =
            commandProp && typeof props[commandProp] === 'string'
              ? (props[commandProp] as string).trim()
              : '';
          if (!commandField) return handler;

          const actions = Array.isArray(handlerRecord.actions) ? handlerRecord.actions : [];
          return {
            ...handlerRecord,
            actions: actions.map((action) => {
              if (
                action &&
                typeof action === 'object' &&
                (action as Record<string, unknown>).type === 'callWrite'
              ) {
                return {
                  ...(action as Record<string, unknown>),
                  payload: `({ ${JSON.stringify(commandField)}: payload })`,
                };
              }
              return action;
            }),
          };
        }),
      ];
    }),
  );

  return next as T;
}

function hydratePlatformDataSource(dataSource: DataSource, deviceId: string): DataSource {
  const targetDataSourceId = getPlatformDeviceDataSourceId(deviceId);
  const rewritten = rewriteGenericPlatformBindings(cloneValue(dataSource), targetDataSourceId);
  if (!isPlatformFieldDataSource(rewritten)) return rewritten;

  const config = (rewritten.config ?? {}) as PlatformFieldConfig;
  const originalConfig = (dataSource.config ?? {}) as PlatformFieldConfig;
  const shouldUseTargetDataSourceId =
    dataSource.id === GENERIC_PLATFORM_DATA_SOURCE_ID ||
    dataSource.id === TEMPLATE_PLATFORM_DATA_SOURCE_ID ||
    originalConfig.deviceId === TEMPLATE_DEVICE_ID ||
    config.deviceId === TEMPLATE_DEVICE_ID;

  return {
    ...rewritten,
    id: shouldUseTargetDataSourceId ? targetDataSourceId : String(rewritten.id),
    type: 'PLATFORM_FIELD',
    config: {
      ...config,
      deviceId,
      bufferSize: normalizePlatformBufferSize(config.bufferSize),
      ...(normalizeRequestedFields(config.requestedFields) !== undefined
        ? { requestedFields: normalizeRequestedFields(config.requestedFields) }
        : {}),
    },
  } as DataSource;
}

export function hydrateDevicePresetWidget(
  widget: Record<string, unknown>,
  deviceId: string,
): Record<string, unknown> {
  const targetDataSourceId = getPlatformDeviceDataSourceId(deviceId);
  const clonedWidget = cloneValue(widget);
  const rewrittenWidget = rewriteGenericPlatformBindings(clonedWidget, targetDataSourceId);
  if (rewrittenWidget.type === 'media/camera-control') {
    return normalizeCameraControlAutoWritePayloads(rewrittenWidget);
  }
  if (rewrittenWidget.type === 'media/ezuikit-player') {
    const withEvents = ensureEzuikitDefaultEvents(rewrittenWidget, targetDataSourceId) as Record<
      string,
      unknown
    >;
    return normalizeEzuikitPlayerAutoWritePayloads(withEvents);
  }
  const fieldId = extractFirstBoundFieldId(clonedWidget.data);
  return normalizeAutoWritePayloads(rewrittenWidget, fieldId);
}

export function hydrateDevicePresetSchema(
  schema: DevicePresetSchema,
  deviceId: string,
): DevicePresetSchema {
  const targetDataSourceId = getPlatformDeviceDataSourceId(deviceId);
  const clonedSchema = cloneValue(schema);

  return {
    ...clonedSchema,
    nodes: Array.isArray(clonedSchema.nodes)
      ? clonedSchema.nodes.map((node) =>
          hydrateDevicePresetWidget(node as Record<string, unknown>, deviceId),
        )
      : [],
    ...(Array.isArray(clonedSchema.dataSources)
      ? {
          dataSources: clonedSchema.dataSources.map((dataSource) =>
            hydratePlatformDataSource(dataSource as DataSource, deviceId),
          ),
        }
      : {}),
  };
}
