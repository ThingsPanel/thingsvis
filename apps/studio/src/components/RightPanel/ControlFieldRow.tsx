import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import type { ControlField, ControlOption, DataBinding } from '@thingsvis/schema';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/NumericInput';
import * as LucideIcons from 'lucide-react';

import FieldPicker, { type FieldPickerValue } from './FieldPicker';
import { IconPicker } from './IconPicker';
import { LocalIconField } from './LocalIconField';
import ImageSourceInput from './ImageSourceInput';
import ModelSourceInput from './ModelSourceInput';
import { ColorInput } from '@/components/ui/color-input';
import { resolveControlText } from '@/lib/i18n/controlText';
import {
  detectBindingMode,
  getBinding,
  isValidExpression,
  makeFieldBindingExpression,
  parseFieldBindingExpression,
  removeBinding,
  upsertBinding,
  type BindingMode,
} from './bindingStorage';

type Props = {
  kernelStore: KernelStore;
  nodeId: string;
  componentType?: string;
  field: ControlField;
  propsValue: unknown;
  bindings: DataBinding[] | undefined;
  currentSize?: { width: number; height: number };
  currentPosition?: { x: number; y: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateNode: (changes: any) => void;
};

const fieldModeDrafts = new Map<string, FieldPickerValue>();

function getFieldModeDraftKey(nodeId: string, targetProp: string): string {
  return `${nodeId}:${targetProp}`;
}

function allowedModes(field: ControlField): BindingMode[] {
  const modes = field.binding?.enabled ? field.binding.modes : [];
  const normalized = modes.filter(
    (m): m is BindingMode => m === 'static' || m === 'field' || m === 'expr',
  );
  return normalized.length ? normalized : ['static'];
}

const DEFAULT_WRITE_EVENT_BY_COMPONENT: Record<string, string> = {
  'interaction/toggle-button': 'change',
  'interaction/basic-switch': 'change',
  'interaction/basic-slider': 'change',
  'interaction/basic-select': 'change',
  'interaction/basic-input': 'submit',
};

const CAMERA_CONTROL_WRITE_EVENT_BY_PROP: Record<string, string> = {
  ptzMoveCommand: 'ptzMove',
  ptzStopCommand: 'ptzStop',
  ptzZoomCommand: 'ptzZoom',
  ptzFocusCommand: 'ptzFocus',
  presetGotoCommand: 'presetGoto',
  snapshotCommand: 'snapshot',
  playbackOpenCommand: 'playbackRequest',
};

const AUTO_WRITE_MARKER = 'field-binding';

type EventHandlerLike = {
  event?: unknown;
  actions?: unknown[];
  [key: string]: unknown;
};

type ActionLike = {
  type?: unknown;
  dataSourceId?: unknown;
  payload?: unknown;
  __thingsvisAutoWrite?: unknown;
  __thingsvisAutoWriteValueType?: unknown;
  [key: string]: unknown;
};

type Model3dSceneLabel = {
  id: string;
  anchor: string;
  title: string;
  value: string | number;
  unit: string;
  visible: boolean;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
};

type Model3dPipeRule = {
  id: string;
  matcherType: 'prefix' | 'contains' | 'exact';
  matcher: string;
  color: string;
  speed: number;
  visible: boolean;
};

const PIPE_MATCHER_OPTIONS: Array<{ value: Model3dPipeRule['matcherType']; label: string }> = [
  { value: 'prefix', label: '前缀' },
  { value: 'contains', label: '包含' },
  { value: 'exact', label: '精确' },
];

function makeStableItemId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'off' ||
      normalized === 'no'
    ) {
      return false;
    }
    if (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'on' ||
      normalized === 'yes'
    ) {
      return true;
    }
  }
  return value == null ? fallback : Boolean(value);
}

function normalizeSceneLabel(value: unknown, index: number): Model3dSceneLabel {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    id: typeof record.id === 'string' && record.id ? record.id : `label-${index + 1}`,
    anchor: typeof record.anchor === 'string' ? record.anchor : '',
    title: typeof record.title === 'string' ? record.title : '',
    value:
      typeof record.value === 'number' || typeof record.value === 'string' ? record.value : '--',
    unit: typeof record.unit === 'string' ? record.unit : '',
    visible: typeof record.visible === 'boolean' ? record.visible : true,
    offsetX: toNumber(record.offsetX, 0),
    offsetY: toNumber(record.offsetY, 0.3),
    offsetZ: toNumber(record.offsetZ, 0),
  };
}

function normalizeSceneLabels(value: unknown): Model3dSceneLabel[] {
  return Array.isArray(value) ? value.map(normalizeSceneLabel) : [];
}

function normalizePipeRule(value: unknown, index: number): Model3dPipeRule {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const matcherType =
    record.matcherType === 'contains' || record.matcherType === 'exact'
      ? record.matcherType
      : 'prefix';
  return {
    id: typeof record.id === 'string' && record.id ? record.id : `pipe-rule-${index + 1}`,
    matcherType,
    matcher: typeof record.matcher === 'string' ? record.matcher : '',
    color: typeof record.color === 'string' && record.color ? record.color : '#38bdf8',
    speed: toNumber(record.speed, 1.8),
    visible: typeof record.visible === 'boolean' ? record.visible : true,
  };
}

function normalizePipeRules(value: unknown): Model3dPipeRule[] {
  return Array.isArray(value) ? value.map(normalizePipeRule) : [];
}

function isDefaultWriteBindingTarget(
  componentType: string | undefined,
  targetProp: string,
): boolean {
  if (componentType === 'media/camera-control') {
    return Boolean(CAMERA_CONTROL_WRITE_EVENT_BY_PROP[targetProp]);
  }

  return (
    targetProp === 'value' &&
    Boolean(componentType && DEFAULT_WRITE_EVENT_BY_COMPONENT[componentType])
  );
}

function getDefaultWriteEventName(
  componentType: string | undefined,
  targetProp: string,
): string | undefined {
  if (componentType === 'media/camera-control') {
    return CAMERA_CONTROL_WRITE_EVENT_BY_PROP[targetProp];
  }

  return componentType ? DEFAULT_WRITE_EVENT_BY_COMPONENT[componentType] : undefined;
}

function getRootFieldPath(fieldPath: string): string | null {
  if (!fieldPath || fieldPath === '(root)') return null;
  return fieldPath.split(/[.[\]]/).filter(Boolean)[0] ?? null;
}

function selectOptionCaption(
  opt: ControlOption,
  showOptionValues: boolean | undefined,
  locale: string,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string {
  const labelText = resolveControlText(opt.label, locale, t);
  if (!showOptionValues) return labelText;
  const valueHint = opt.value === '' ? '""' : String(opt.value);
  return `${labelText} (${valueHint})`;
}

function createDefaultWritePayload(
  componentType: string | undefined,
  fieldId: string,
  fieldType: FieldPickerValue['fieldType'] | undefined,
): string {
  if (componentType === 'interaction/basic-switch' && fieldType === 'number') {
    return `({ ${JSON.stringify(fieldId)}: payload ? 1 : 0 })`;
  }
  return `({ ${JSON.stringify(fieldId)}: payload })`;
}

function createDefaultWriteAction(
  componentType: string | undefined,
  dataSourceId: string,
  fieldId: string,
  fieldType: FieldPickerValue['fieldType'] | undefined,
): ActionLike {
  return {
    type: 'callWrite',
    dataSourceId,
    payload: createDefaultWritePayload(componentType, fieldId, fieldType),
    __thingsvisAutoWrite: AUTO_WRITE_MARKER,
    ...(fieldType === 'boolean' || fieldType === 'number'
      ? { __thingsvisAutoWriteValueType: fieldType }
      : {}),
  };
}

function fitNodeBoxToAsset(
  size: { width: number; height: number } | undefined,
  position: { x: number; y: number } | undefined,
  assetWidth: number | undefined,
  assetHeight: number | undefined,
) {
  if (!size || !position || !assetWidth || !assetHeight || assetWidth <= 0 || assetHeight <= 0) {
    return {};
  }

  const maxSide = Math.max(size.width, size.height);
  const aspect = assetWidth / assetHeight;
  const nextSize =
    aspect >= 1
      ? { width: maxSide, height: maxSide / aspect }
      : { width: maxSide * aspect, height: maxSide };
  return {
    size: nextSize,
    position: {
      x: position.x + (size.width - nextSize.width) / 2,
      y: position.y + (size.height - nextSize.height) / 2,
    },
  };
}

function isAutoWriteAction(action: unknown): action is ActionLike {
  return (
    Boolean(action) &&
    typeof action === 'object' &&
    (action as ActionLike).type === 'callWrite' &&
    (action as ActionLike).__thingsvisAutoWrite === AUTO_WRITE_MARKER
  );
}

function ensureDefaultWriteEvent(
  events: EventHandlerLike[] | undefined,
  eventName: string,
  componentType: string | undefined,
  dataSourceId: string,
  fieldId: string,
  fieldType: FieldPickerValue['fieldType'] | undefined,
): EventHandlerLike[] | null {
  const sourceEvents = Array.isArray(events) ? events : [];
  const defaultAction = createDefaultWriteAction(componentType, dataSourceId, fieldId, fieldType);
  let found = false;
  let changed = false;

  const nextEvents = sourceEvents.map((handler) => {
    if (handler.event !== eventName) return handler;
    found = true;

    const actions = Array.isArray(handler.actions) ? handler.actions : [];
    const hasAutoAction = actions.some(isAutoWriteAction);
    const hasManualActions = actions.some((action) => !isAutoWriteAction(action));

    if (hasManualActions && !hasAutoAction) return handler;

    const nextActions = [...actions.filter((action) => !isAutoWriteAction(action)), defaultAction];
    const currentAuto = actions.find(isAutoWriteAction) as ActionLike | undefined;
    changed =
      changed ||
      !hasAutoAction ||
      currentAuto?.dataSourceId !== defaultAction.dataSourceId ||
      currentAuto?.payload !== defaultAction.payload ||
      currentAuto?.__thingsvisAutoWriteValueType !== defaultAction.__thingsvisAutoWriteValueType ||
      nextActions.length !== actions.length;

    return {
      ...handler,
      actions: nextActions,
    };
  });

  if (!found) {
    return [...sourceEvents, { event: eventName, actions: [defaultAction] }];
  }

  return changed ? nextEvents : null;
}

function removeDefaultWriteEvent(
  events: EventHandlerLike[] | undefined,
  eventName: string,
): EventHandlerLike[] | null {
  const sourceEvents = Array.isArray(events) ? events : [];
  let changed = false;

  const nextEvents = sourceEvents
    .map((handler) => {
      if (handler.event !== eventName) return handler;
      const actions = Array.isArray(handler.actions) ? handler.actions : [];
      const nextActions = actions.filter((action) => !isAutoWriteAction(action));
      if (nextActions.length === actions.length) return handler;
      changed = true;
      return { ...handler, actions: nextActions };
    })
    .filter((handler) => {
      if (handler.event !== eventName) return true;
      return Array.isArray(handler.actions) && handler.actions.length > 0;
    });

  return changed ? nextEvents : null;
}

function buildDefaultWriteEventsForSelection(
  componentType: string | undefined,
  targetProp: string,
  selection: FieldPickerValue | null,
  events: EventHandlerLike[] | undefined,
): EventHandlerLike[] | null {
  if (!isDefaultWriteBindingTarget(componentType, targetProp)) return null;
  const eventName = getDefaultWriteEventName(componentType, targetProp);
  if (!eventName) return null;

  if (!selection?.dataSourceId || !selection.fieldPath) {
    return removeDefaultWriteEvent(events, eventName);
  }

  const fieldId = getRootFieldPath(selection.fieldPath);
  if (!fieldId) return null;

  return ensureDefaultWriteEvent(
    events,
    eventName,
    componentType,
    selection.dataSourceId,
    fieldId,
    selection.fieldType,
  );
}

export function ControlFieldRow({
  kernelStore,
  nodeId,
  componentType,
  field,
  propsValue,
  bindings,
  currentSize,
  currentPosition,
  updateNode,
}: Props) {
  const { t, i18n } = useTranslation('editor');
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const modes = useMemo(() => allowedModes(field), [field]);

  const persistedMode = useMemo(
    () => detectBindingMode(bindings, field.path),
    [bindings, field.path],
  );
  const binding = useMemo(() => getBinding(bindings, field.path), [bindings, field.path]);
  const fieldModeDraftKey = useMemo(
    () => getFieldModeDraftKey(nodeId, field.path),
    [nodeId, field.path],
  );

  const [mode, setMode] = useState<BindingMode>(() =>
    persistedMode === 'static' && fieldModeDrafts.has(fieldModeDraftKey) ? 'field' : persistedMode,
  );

  const [fieldSelection, setFieldSelection] = useState<FieldPickerValue | null>(() => {
    if (binding) {
      const sel = parseFieldBindingExpression(binding.expression);
      if (sel) {
        const historyConfig = (binding as any).historyConfig;
        return {
          ...sel,
          ...(binding.transform ? { transform: binding.transform } : {}),
          ...(historyConfig ? { historyConfig } : {}),
        };
      }
      return sel;
    }
    return fieldModeDrafts.get(fieldModeDraftKey) ?? null;
  });

  const [exprDraft, setExprDraft] = useState<string>(
    () => binding?.expression ?? '{{ ds.<id>.data.<path> }}',
  );

  const exprIsValid = useMemo(() => isValidExpression(exprDraft), [exprDraft]);

  // When switching nodes/fields, sync UI mode to persisted mode.
  // Do NOT continuously force UI mode from bindings; otherwise switching Field -> Expr
  // will get "snapped back" as long as the expression still matches the field-binding pattern.
  useEffect(() => {
    setMode(
      persistedMode === 'static' && fieldModeDrafts.has(fieldModeDraftKey)
        ? 'field'
        : persistedMode,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, field.path]);

  // Handle external binding updates (initial load, undo/redo)
  // Only sync if transitioning to/from 'static' to avoid interfering with Field/Expr preference
  useEffect(() => {
    if (mode === 'field' && fieldSelection) return;
    if (persistedMode !== mode && (mode === 'static' || persistedMode === 'static')) {
      setMode(persistedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedMode]);

  // Keep UI drafts in sync with persisted binding expression.
  useEffect(() => {
    if (!binding) {
      const draft = fieldModeDrafts.get(fieldModeDraftKey) ?? null;
      setFieldSelection(draft);
      if (draft) setMode('field');
      return;
    }
    const selection = parseFieldBindingExpression(binding.expression);
    const historyConfig = (binding as any).historyConfig;
    setFieldSelection(
      selection
        ? {
            ...selection,
            ...(binding.transform ? { transform: binding.transform } : {}),
            ...(historyConfig ? { historyConfig } : {}),
          }
        : selection,
    );
    setExprDraft(binding.expression);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding?.expression, binding?.transform, (binding as any)?.historyConfig]);

  const setStatic = (nextValue: unknown) => {
    updateNode({
      props: { [field.path]: nextValue },
      data: removeBinding(bindings, field.path),
    });
  };

  const setBindingExpr = (expression: string) => {
    // Parse expression to populate other binding fields (like dataSourcePath)
    const selection = parseFieldBindingExpression(expression);
    const dataSourcePath = selection ? `ds.${selection.dataSourceId}.data` : undefined;

    updateNode({
      data: upsertBinding(bindings, {
        targetProp: field.path,
        expression,
        dataSourcePath,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    });
  };

  const handleModeChange = (next: BindingMode) => {
    setMode(next);

    if (next === 'static') {
      fieldModeDrafts.delete(fieldModeDraftKey);
      setFieldSelection(null);
      updateNode({ data: removeBinding(bindings, field.path) });
    }

    if (next === 'expr') {
      fieldModeDrafts.delete(fieldModeDraftKey);
      // Switching to Expr should be immediate in the UI.
      // Persist only when user enters a valid expression in the editor.
      setExprDraft(binding?.expression ?? exprDraft);
    }

    if (next === 'field') {
      const draft = fieldSelection ?? { dataSourceId: '', fieldPath: '' };
      setFieldSelection(draft);
      fieldModeDrafts.set(fieldModeDraftKey, draft);
    }

    // For 'field', we wait for a concrete FieldPicker selection to persist.
  };

  const showOverriddenHint = Boolean(binding) && propsValue !== undefined;
  const fieldLabel = resolveControlText(field.label, locale, t);
  const fieldDescription = resolveControlText(field.description, locale, t);
  const labelHoverTitle = fieldDescription ? `${fieldLabel}\n${fieldDescription}` : fieldLabel;
  const numberFieldUsesFloat =
    [propsValue, field.default, field.min, field.max, field.step].some(
      (candidate) => typeof candidate === 'number' && !Number.isInteger(candidate),
    ) ||
    (typeof field.step === 'number' && field.step > 0 && field.step < 1);
  const showSelectPlaceholder = !(componentType === 'basic/icon' && field.path === 'iconSource');

  const modeLabel = (m: BindingMode) => {
    switch (m) {
      case 'static':
        return t('binding.static', 'static');
      case 'field':
        return t('binding.field', 'field');
      case 'expr':
        return t('binding.expression', 'expr');
      default:
        return m;
    }
  };

  useEffect(() => {
    const currentEvents = (
      (kernelStore.getState() as KernelState).nodesById[nodeId]?.schemaRef as
        | { events?: EventHandlerLike[] }
        | undefined
    )?.events;
    const nextEvents = buildDefaultWriteEventsForSelection(
      componentType,
      field.path,
      fieldSelection,
      currentEvents,
    );
    if (nextEvents) updateNode({ events: nextEvents });
  }, [componentType, field.path, fieldSelection, kernelStore, nodeId, updateNode]);

  return (
    <div className="space-y-1.5 relative group/field">
      <div className="flex items-center justify-between gap-2">
        <label
          className={`text-sm font-medium text-muted-foreground truncate flex-1${fieldDescription ? ' cursor-help' : ''}`}
          title={labelHoverTitle}
        >
          {fieldLabel}
        </label>

        {modes.length > 1 && (
          <select
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as BindingMode)}
            className="appearance-none h-6 px-2.5 pr-6 text-[11px] font-medium rounded border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset transition-colors"
            title="Binding Mode"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
              backgroundSize: '12px',
            }}
          >
            {modes.map((m) => (
              <option key={m} value={m} className="font-medium bg-background text-foreground">
                {modeLabel(m)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="w-full min-w-0 flex flex-col justify-center">
        {mode === 'static' && (
          <>
            {field.kind === 'string' &&
              (componentType === 'resources/model-3d' && field.path === 'modelUrl' ? (
                <ModelSourceInput
                  value={typeof propsValue === 'string' ? propsValue : ''}
                  onChange={(nextValue) => setStatic(nextValue)}
                />
              ) : (
                <Input
                  value={typeof propsValue === 'string' ? propsValue : ''}
                  onChange={(e) => setStatic(e.target.value)}
                  className="h-8 text-sm"
                  placeholder={
                    field.placeholder ? resolveControlText(field.placeholder, locale, t) : undefined
                  }
                />
              ))}

            {field.kind === 'textarea' && (
              <textarea
                value={typeof propsValue === 'string' ? propsValue : ''}
                onChange={(e) => setStatic(e.target.value)}
                className="w-full h-20 p-2 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset focus:outline-none resize-y"
                placeholder={
                  field.placeholder ? resolveControlText(field.placeholder, locale, t) : undefined
                }
              />
            )}

            {field.kind === 'number' && (
              <NumericInput
                value={(() => {
                  if (typeof propsValue === 'number' && Number.isFinite(propsValue))
                    return propsValue;
                  if (typeof propsValue === 'string') {
                    // Backward-compat: common preset tokens & numeric strings.
                    if (propsValue === 'thin') return 2;
                    if (propsValue === 'medium') return 4;
                    if (propsValue === 'thick') return 8;
                    const n = Number(propsValue);
                    if (Number.isFinite(n)) return n;
                  }
                  return typeof field.default === 'number' ? field.default : 0;
                })()}
                onValueChange={(nextValue) => setStatic(nextValue ?? field.default ?? 0)}
                className="h-8 text-sm"
                min={field.min}
                max={field.max}
                mode={numberFieldUsesFloat ? 'float' : 'int'}
              />
            )}

            {field.kind === 'color' && (
              <ColorInput
                value={typeof propsValue === 'string' ? propsValue : ''}
                onChange={(v) => setStatic(v)}
              />
            )}

            {field.kind === 'nodeSelect' && (
              <NodeSelector
                kernelStore={kernelStore}
                currentNodeId={nodeId}
                value={typeof propsValue === 'string' ? propsValue : ''}
                onChange={(v) => setStatic(v)}
              />
            )}

            {field.kind === 'select' && field.options && (
              <select
                value={
                  typeof propsValue === 'string' || typeof propsValue === 'number' ? propsValue : ''
                }
                onChange={(e) => setStatic(e.target.value)}
                className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
              >
                {showSelectPlaceholder ? (
                  <option value="">{t('common.pleaseSelect', { defaultValue: '(请选择)' })}</option>
                ) : null}
                {field.options.map((opt, optIdx) => (
                  <option key={`${field.path}:${optIdx}:${String(opt.value)}`} value={opt.value}>
                    {selectOptionCaption(opt, field.showOptionValues, locale, t)}
                  </option>
                ))}
              </select>
            )}

            {/* Boolean / Switch */}
            {field.kind === 'boolean' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={toBoolean(propsValue)}
                  onChange={(e) => setStatic(e.target.checked)}
                  className="w-4 h-4 rounded border-input accent-[#6965db]"
                />
                <span className="text-sm text-muted-foreground">
                  {toBoolean(propsValue) ? t('common.on') : t('common.off')}
                </span>
              </label>
            )}

            {/* Slider */}
            {field.kind === 'slider' && (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={field.min ?? 0}
                  max={field.max ?? 100}
                  step={field.step ?? 1}
                  value={
                    typeof propsValue === 'number' ? propsValue : ((field.default as number) ?? 0)
                  }
                  onChange={(e) => setStatic(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-[#6965db]"
                />
                <NumericInput
                  value={
                    typeof propsValue === 'number' ? propsValue : ((field.default as number) ?? 0)
                  }
                  onValueChange={(nextValue) => setStatic(nextValue ?? field.default ?? 0)}
                  className="h-8 text-sm w-16 tabular-nums"
                  min={field.min}
                  max={field.max}
                  mode={numberFieldUsesFloat ? 'float' : 'int'}
                />
              </div>
            )}

            {/* Segmented / Radio group inline */}
            {(field.kind === 'segmented' || field.kind === 'radio') && field.options && (
              <div className="flex gap-1 p-1 bg-muted rounded-md">
                {field.options.map((opt) => {
                  // 动态获取 Lucide 图标
                  const IconComponent = opt.icon
                    ? (
                        LucideIcons as unknown as Record<
                          string,
                          React.ComponentType<{ className?: string }>
                        >
                      )[opt.icon]
                    : null;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setStatic(opt.value)}
                      title={resolveControlText(opt.label, locale, t)}
                      className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center justify-center ${
                        propsValue === opt.value
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {IconComponent ? (
                        <IconComponent className="w-4 h-4" />
                      ) : (
                        resolveControlText(opt.label, locale, t)
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* JSON Editor (basic textarea for now) */}
            {field.kind === 'json' && (
              <textarea
                value={(() => {
                  const valToSerialize =
                    propsValue !== undefined
                      ? propsValue
                      : field.default !== undefined
                        ? field.default
                        : {};
                  return typeof valToSerialize === 'object'
                    ? JSON.stringify(valToSerialize, null, 2)
                    : String(valToSerialize);
                })()}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setStatic(parsed);
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full h-24 p-2 text-sm font-mono rounded-sm border border-input bg-muted/20 focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset focus:outline-none resize-y"
                placeholder="{}"
              />
            )}

            {/* Image control - supports upload, URL, and base64 */}
            {field.kind === 'image' && (
              <ImageSourceInput
                value={typeof propsValue === 'string' ? propsValue : ''}
                onChange={(v) => setStatic(v)}
              />
            )}

            {field.kind === 'icon' && (
              <IconPicker
                value={typeof propsValue === 'string' ? propsValue : ''}
                onChange={(v) => setStatic(v)}
              />
            )}

            {field.kind === 'localIcon' && (
              <LocalIconField
                value={typeof propsValue === 'string' ? propsValue : ''}
                onPick={(result) => {
                  updateNode({
                    props: {
                      iconSource: 'local',
                      localIconId: result.id,
                      assetKind: result.kind,
                      assetUrl: result.assetUrl,
                      svgContent: result.svgContent ?? '',
                    },
                    ...fitNodeBoxToAsset(currentSize, currentPosition, result.width, result.height),
                  });
                }}
              />
            )}

            {field.kind === 'model3dLabels' && (
              <Model3dLabelsEditor value={propsValue} onChange={setStatic} />
            )}

            {field.kind === 'model3dPipeRules' && (
              <Model3dPipeRulesEditor value={propsValue} onChange={setStatic} />
            )}

            {/* Fallback for unknown kinds */}
            {![
              'string',
              'number',
              'color',
              'nodeSelect',
              'select',
              'boolean',
              'slider',
              'segmented',
              'radio',
              'json',
              'textarea',
              'image',
              'icon',
              'localIcon',
              'model3dLabels',
              'model3dPipeRules',
            ].includes(field.kind) && (
              <Input
                value={propsValue === undefined ? '' : String(propsValue)}
                onChange={(e) => setStatic(e.target.value)}
                className="h-8 text-sm"
              />
            )}
          </>
        )}

        {mode === 'field' && (
          <FieldPicker
            kernelStore={kernelStore}
            value={fieldSelection}
            targetKind={field.kind}
            writableOnly={isDefaultWriteBindingTarget(componentType, field.path)}
            onChange={(next) => {
              setFieldSelection(next);
              const currentEvents = (
                (kernelStore.getState() as KernelState).nodesById[nodeId]?.schemaRef as
                  | { events?: EventHandlerLike[] }
                  | undefined
              )?.events;
              const nextEvents = buildDefaultWriteEventsForSelection(
                componentType,
                field.path,
                next,
                currentEvents,
              );

              if (next?.dataSourceId && next.fieldPath) {
                fieldModeDrafts.delete(fieldModeDraftKey);
                const expression = makeFieldBindingExpression(next);
                const selection = parseFieldBindingExpression(expression);
                const dataSourcePath = selection ? `ds.${selection.dataSourceId}.data` : undefined;
                updateNode({
                  data: upsertBinding(bindings, {
                    targetProp: field.path,
                    expression,
                    dataSourcePath,
                    ...(next.transform ? { transform: next.transform } : {}),
                    ...(next.historyConfig ? { historyConfig: next.historyConfig } : {}),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } as any),
                  ...(nextEvents ? { events: nextEvents } : {}),
                });
                return;
              }

              if (next && !next.fieldPath) {
                fieldModeDrafts.set(fieldModeDraftKey, next);
                return;
              }

              fieldModeDrafts.delete(fieldModeDraftKey);
              updateNode({
                data: removeBinding(bindings, field.path),
                ...(nextEvents ? { events: nextEvents } : {}),
              });
            }}
          />
        )}

        {mode === 'expr' && (
          <>
            <textarea
              value={exprDraft}
              onChange={(e) => {
                const next = e.target.value;
                setExprDraft(next);
                if (isValidExpression(next)) {
                  setBindingExpr(next);
                }
              }}
              className="w-full h-16 p-2 text-sm font-mono rounded-sm border border-input bg-muted/20 focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset focus:outline-none resize-none"
              placeholder="{{ ds.<id>.data.<path> }}"
            />
            {!exprIsValid && (
              <p className="text-xs text-destructive">
                {t('binding.exprTip', 'Expression must be wrapped in {{ }}.')}
              </p>
            )}
          </>
        )}

        {showOverriddenHint && (
          <p className="text-xs text-muted-foreground italic">
            {t('binding.overridden', 'Static value is overridden by binding.')}
          </p>
        )}
        {fieldDescription && (
          <p className="text-xs text-muted-foreground leading-relaxed">{fieldDescription}</p>
        )}
      </div>
    </div>
  );
}

function Model3dLabelsEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (nextValue: Model3dSceneLabel[]) => void;
}) {
  const labels = normalizeSceneLabels(value);

  const updateAt = (index: number, patch: Partial<Model3dSceneLabel>) => {
    onChange(labels.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const removeAt = (index: number) => {
    onChange(labels.filter((_, idx) => idx !== index));
  };

  const addLabel = () => {
    onChange([
      ...labels,
      {
        id: makeStableItemId('label'),
        anchor: '',
        title: '标签',
        value: '--',
        unit: '',
        visible: true,
        offsetX: 0,
        offsetY: 0.3,
        offsetZ: 0,
      },
    ]);
  };

  return (
    <div className="space-y-2">
      {labels.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-md border border-border bg-muted/20 p-2">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={item.visible}
                onChange={(e) => updateAt(index, { visible: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-input accent-[#6965db]"
              />
              显示
            </label>
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="h-6 px-2 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              删除
            </button>
          </div>
          <Input
            value={item.anchor}
            onChange={(e) => updateAt(index, { anchor: e.target.value })}
            className="h-8 text-xs"
            placeholder="锚点节点名，例如 anchor_1"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={item.title}
              onChange={(e) => updateAt(index, { title: e.target.value })}
              className="h-8 text-xs"
              placeholder="标题"
            />
            <Input
              value={String(item.value)}
              onChange={(e) => updateAt(index, { value: e.target.value })}
              className="h-8 text-xs"
              placeholder="数值或绑定结果"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Input
              value={item.unit}
              onChange={(e) => updateAt(index, { unit: e.target.value })}
              className="h-8 text-xs"
              placeholder="单位"
            />
            <NumericInput
              value={item.offsetX}
              onValueChange={(next) => updateAt(index, { offsetX: next ?? 0 })}
              className="h-8 text-xs"
              mode="float"
            />
            <NumericInput
              value={item.offsetY}
              onValueChange={(next) => updateAt(index, { offsetY: next ?? 0 })}
              className="h-8 text-xs"
              mode="float"
            />
            <NumericInput
              value={item.offsetZ}
              onValueChange={(next) => updateAt(index, { offsetZ: next ?? 0 })}
              className="h-8 text-xs"
              mode="float"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addLabel}
        className="w-full h-8 text-xs rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        添加标签
      </button>
    </div>
  );
}

function Model3dPipeRulesEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (nextValue: Model3dPipeRule[]) => void;
}) {
  const rules = normalizePipeRules(value);

  const updateAt = (index: number, patch: Partial<Model3dPipeRule>) => {
    onChange(rules.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const removeAt = (index: number) => {
    onChange(rules.filter((_, idx) => idx !== index));
  };

  const addRule = () => {
    onChange([
      ...rules,
      {
        id: makeStableItemId('pipe-rule'),
        matcherType: 'prefix',
        matcher: '',
        color: '#38bdf8',
        speed: 1.8,
        visible: true,
      },
    ]);
  };

  return (
    <div className="space-y-2">
      {rules.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-md border border-border bg-muted/20 p-2">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={item.visible}
                onChange={(e) => updateAt(index, { visible: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-input accent-[#6965db]"
              />
              启用
            </label>
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="h-6 px-2 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              删除
            </button>
          </div>
          <div className="grid grid-cols-[92px_1fr] gap-2">
            <select
              value={item.matcherType}
              onChange={(e) =>
                updateAt(index, { matcherType: e.target.value as Model3dPipeRule['matcherType'] })
              }
              className="h-8 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring"
            >
              {PIPE_MATCHER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input
              value={item.matcher}
              onChange={(e) => updateAt(index, { matcher: e.target.value })}
              className="h-8 text-xs"
              placeholder="mesh 名称匹配值"
            />
          </div>
          <div className="grid grid-cols-[1fr_96px] gap-2">
            <ColorInput value={item.color} onChange={(next) => updateAt(index, { color: next })} />
            <NumericInput
              value={item.speed}
              onValueChange={(next) => updateAt(index, { speed: next ?? 1.8 })}
              className="h-8 text-xs"
              min={0.1}
              max={10}
              mode="float"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRule}
        className="w-full h-8 text-xs rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        添加规则
      </button>
    </div>
  );
}

/**
 * 节点选择器组件
 * 用于在属性面板中选择画布上的其他节点
 */
function NodeSelector({
  kernelStore,
  currentNodeId,
  value,
  onChange,
}: {
  kernelStore: KernelStore;
  currentNodeId: string;
  value: string;
  onChange: (nodeId: string) => void;
}) {
  const { t } = useTranslation('editor');
  // 订阅 store 获取所有节点
  const nodesById = useSyncExternalStore(
    useCallback((cb) => kernelStore.subscribe(cb), [kernelStore]),
    () => (kernelStore.getState() as KernelState).nodesById,
  );

  // 获取可选节点列表（排除当前节点）
  const nodeOptions = useMemo(() => {
    return Object.values(nodesById)
      .filter((node) => node.id !== currentNodeId && node.visible)
      .map((node) => ({
        id: node.id,
        type: node.schemaRef.type,
        label: `${node.schemaRef.type.split('/').pop()} (${node.id.slice(0, 8)}...)`,
      }));
  }, [nodesById, currentNodeId]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
    >
      <option value="">{t('binding.noConnection', '(none)')}</option>
      {nodeOptions.map((node) => (
        <option key={node.id} value={node.id}>
          {node.label}
        </option>
      ))}
    </select>
  );
}

export default ControlFieldRow;
