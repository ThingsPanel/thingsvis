import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import type { ControlField, DataBinding } from '@thingsvis/schema';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/NumericInput';
import * as LucideIcons from 'lucide-react';

import FieldPicker, { type FieldPickerValue } from './FieldPicker';
import { IconPicker } from './IconPicker';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateNode: (changes: any) => void;
};

function allowedModes(field: ControlField): BindingMode[] {
  const modes = field.binding?.enabled ? field.binding.modes : [];
  const normalized = modes.filter(
    (m): m is BindingMode => m === 'static' || m === 'field' || m === 'expr',
  );
  return normalized.length ? normalized : ['static'];
}

const DEFAULT_WRITE_EVENT_BY_COMPONENT: Record<string, string> = {
  'interaction/basic-switch': 'change',
  'interaction/basic-slider': 'change',
  'interaction/basic-select': 'change',
  'interaction/basic-input': 'submit',
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
  [key: string]: unknown;
};

function isDefaultWriteBindingTarget(
  componentType: string | undefined,
  targetProp: string,
): boolean {
  return (
    targetProp === 'value' &&
    Boolean(componentType && DEFAULT_WRITE_EVENT_BY_COMPONENT[componentType])
  );
}

function getRootFieldPath(fieldPath: string): string | null {
  if (!fieldPath || fieldPath === '(root)') return null;
  return fieldPath.split(/[.[\]]/).filter(Boolean)[0] ?? null;
}

function createDefaultWriteAction(dataSourceId: string, fieldId: string): ActionLike {
  return {
    type: 'callWrite',
    dataSourceId,
    payload: `({ ${JSON.stringify(fieldId)}: payload })`,
    __thingsvisAutoWrite: AUTO_WRITE_MARKER,
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
  dataSourceId: string,
  fieldId: string,
): EventHandlerLike[] | null {
  const sourceEvents = Array.isArray(events) ? events : [];
  const defaultAction = createDefaultWriteAction(dataSourceId, fieldId);
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
  const eventName = componentType ? DEFAULT_WRITE_EVENT_BY_COMPONENT[componentType] : undefined;
  if (!eventName) return null;

  if (!selection?.dataSourceId || !selection.fieldPath) {
    return removeDefaultWriteEvent(events, eventName);
  }

  const fieldId = getRootFieldPath(selection.fieldPath);
  if (!fieldId) return null;

  return ensureDefaultWriteEvent(events, eventName, selection.dataSourceId, fieldId);
}

export function ControlFieldRow({
  kernelStore,
  nodeId,
  componentType,
  field,
  propsValue,
  bindings,
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

  const [mode, setMode] = useState<BindingMode>(persistedMode);

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
    return null;
  });

  const [exprDraft, setExprDraft] = useState<string>(
    () => binding?.expression ?? '{{ ds.<id>.data.<path> }}',
  );

  const exprIsValid = useMemo(() => isValidExpression(exprDraft), [exprDraft]);

  // When switching nodes/fields, sync UI mode to persisted mode.
  // Do NOT continuously force UI mode from bindings; otherwise switching Field -> Expr
  // will get "snapped back" as long as the expression still matches the field-binding pattern.
  useEffect(() => {
    setMode(persistedMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, field.path]);

  // Handle external binding updates (initial load, undo/redo)
  // Only sync if transitioning to/from 'static' to avoid interfering with Field/Expr preference
  useEffect(() => {
    if (persistedMode !== mode && (mode === 'static' || persistedMode === 'static')) {
      setMode(persistedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedMode]);

  // Keep UI drafts in sync with persisted binding expression.
  useEffect(() => {
    if (!binding) {
      setFieldSelection(null);
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
      updateNode({ data: removeBinding(bindings, field.path) });
    }

    if (next === 'expr') {
      // Switching to Expr should be immediate in the UI.
      // Persist only when user enters a valid expression in the editor.
      setExprDraft(binding?.expression ?? exprDraft);
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
                <option value="">{t('common.pleaseSelect')}</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {resolveControlText(opt.label, locale, t)}
                  </option>
                ))}
              </select>
            )}

            {/* Boolean / Switch */}
            {field.kind === 'boolean' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(propsValue)}
                  onChange={(e) => setStatic(e.target.checked)}
                  className="w-4 h-4 rounded border-input accent-[#6965db]"
                />
                <span className="text-sm text-muted-foreground">
                  {propsValue ? t('common.on') : t('common.off')}
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
