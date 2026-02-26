import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import type { ControlField, DataBinding } from '@thingsvis/schema';
import { Input } from '@/components/ui/input';
import * as LucideIcons from 'lucide-react';

import FieldPicker, { type FieldPickerValue } from './FieldPicker';
import ImageSourceInput from './ImageSourceInput';
import { resolveLabel } from './PropsPanel';
import {
  detectBindingMode,
  getBinding,
  isValidExpression,
  makeFieldBindingExpression,
  parseFieldBindingExpression,
  removeBinding,
  upsertBinding,
  type BindingMode
} from './bindingStorage';

type Props = {
  kernelStore: KernelStore;
  nodeId: string;
  field: ControlField;
  propsValue: unknown;
  bindings: DataBinding[] | undefined;
  updateNode: (changes: any) => void;

};

function allowedModes(field: ControlField): BindingMode[] {
  const modes = field.binding?.enabled ? field.binding.modes : [];
  const normalized = modes.filter((m): m is BindingMode => m === 'static' || m === 'field' || m === 'expr');
  return normalized.length ? normalized : ['static'];
}

export function ControlFieldRow({ kernelStore, nodeId, field, propsValue, bindings, updateNode }: Props) {
  const { t, i18n } = useTranslation('editor');
  const lang = i18n.language;
  const modes = useMemo(() => allowedModes(field), [field]);

  const persistedMode = useMemo(() => detectBindingMode(bindings, field.path), [bindings, field.path]);
  const binding = useMemo(() => getBinding(bindings, field.path), [bindings, field.path]);

  const [mode, setMode] = useState<BindingMode>(persistedMode);

  const [fieldSelection, setFieldSelection] = useState<FieldPickerValue | null>(() => {
    if (binding) return parseFieldBindingExpression(binding.expression);
    return null;
  });

  const [exprDraft, setExprDraft] = useState<string>(() => binding?.expression ?? '{{ ds.<id>.data.<path> }}');

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
  }, [persistedMode]);

  // Keep UI drafts in sync with persisted binding expression.
  useEffect(() => {
    if (!binding) {
      setFieldSelection(null);
      return;
    }
    const selection = parseFieldBindingExpression(binding.expression);
    setFieldSelection(selection);
    setExprDraft(binding.expression);
  }, [binding?.expression]);

  const setStatic = (nextValue: unknown) => {
    updateNode({
      props: { [field.path]: nextValue },
      data: removeBinding(bindings, field.path)
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
        dataSourcePath
      } as any)
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

  const showOverriddenHint = mode !== 'static' && propsValue !== undefined;

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          {
            typeof field.label === 'object'
              // map 格式：直接取当前语言，第三方 SDK 组件自带多语言
              ? resolveLabel(field.label, lang)
              // 字符串：尝试当 i18n key 查（内置组件），找不到则原文输出
              : t(field.label, { defaultValue: field.label })
          }
        </label>

        {modes.length > 1 && (
          <select
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as BindingMode)}
            className="h-7 px-2 text-xs rounded-sm border border-input bg-background min-w-20"
          >
            {modes.map((m) => (
              <option key={m} value={m}>
                {modeLabel(m)}
              </option>
            ))}
          </select>
        )}
      </div>

      {mode === 'static' && (
        <>
          {field.kind === 'string' && (
            <Input
              value={typeof propsValue === 'string' ? propsValue : ''}
              onChange={(e) => setStatic(e.target.value)}
              className="h-8 text-sm"
              placeholder={field.placeholder ? t(field.placeholder, { defaultValue: field.placeholder }) : undefined}
            />
          )}

          {field.kind === 'textarea' && (
            <textarea
              value={typeof propsValue === 'string' ? propsValue : ''}
              onChange={(e) => setStatic(e.target.value)}
              className="w-full h-20 p-2 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none resize-y"
              placeholder={field.placeholder ? t(field.placeholder, { defaultValue: field.placeholder }) : undefined}
            />
          )}

          {field.kind === 'number' && (
            <Input
              type="number"
              value={(() => {
                if (typeof propsValue === 'number' && Number.isFinite(propsValue)) return propsValue;
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
              onChange={(e) => setStatic(Number(e.target.value))}
              className="h-8 text-sm"
            />
          )}

          {field.kind === 'color' && (
            <div className="flex gap-1.5 items-center">
              {/* 透明按钮 */}
              <button
                type="button"
                onClick={() => setStatic('transparent')}
                title={t('common.transparent', 'Transparent')}
                className={`w-6 h-6 rounded-sm border flex-shrink-0 ${propsValue === 'transparent'
                  ? 'ring-2 ring-ring ring-offset-1'
                  : 'border-input'
                  }`}
                style={{
                  background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
              />
              {/* 颜色选择器 */}
              <Input
                type="color"
                value={typeof propsValue === 'string' && propsValue && propsValue !== 'transparent' ? propsValue : '#000000'}
                onChange={(e) => setStatic(e.target.value)}
                className="w-6 h-6 p-0 border-0 overflow-hidden rounded-sm cursor-pointer flex-shrink-0"
              />
              {/* 文本输入 */}
              <Input
                value={typeof propsValue === 'string' ? propsValue : ''}
                onChange={(e) => setStatic(e.target.value)}
                placeholder={t('common.transparentInput', 'transparent / #hex / rgba()')}
                className="h-8 flex-1 text-sm font-mono"
              />
            </div>
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
              value={typeof propsValue === 'string' || typeof propsValue === 'number' ? propsValue : ''}
              onChange={(e) => setStatic(e.target.value)}
              className="w-full h-8 px-3 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
            >
              <option value="">{t('common.pleaseSelect')}</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {
                    typeof opt.label === 'object'
                      ? resolveLabel(opt.label, lang)
                      : t(opt.label, { defaultValue: opt.label })
                  }
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
                className="w-4 h-4 rounded border-input"
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
                value={typeof propsValue === 'number' ? propsValue : (field.default as number ?? 0)}
                onChange={(e) => setStatic(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-muted"
              />
              <span className="text-sm text-muted-foreground w-12 text-right tabular-nums">
                {typeof propsValue === 'number' ? propsValue : (field.default as number ?? 0)}
              </span>
            </div>
          )}

          {/* Segmented / Radio group inline */}
          {(field.kind === 'segmented' || field.kind === 'radio') && field.options && (
            <div className="flex gap-1 p-1 bg-muted rounded-md">
              {field.options.map((opt) => {
                // 动态获取 Lucide 图标
                const IconComponent = opt.icon ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[opt.icon] : null;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatic(opt.value)}
                    title={typeof opt.label === 'object' ? resolveLabel(opt.label, lang) : opt.label}
                    className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center justify-center ${propsValue === opt.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {IconComponent
                      ? <IconComponent className="w-4 h-4" />
                      : typeof opt.label === 'object'
                        ? resolveLabel(opt.label, lang)
                        : t(opt.label, { defaultValue: opt.label })
                    }
                  </button>
                );
              })}
            </div>
          )}

          {/* JSON Editor (basic textarea for now) */}
          {field.kind === 'json' && (
            <textarea
              value={(() => {
                const valToSerialize = propsValue !== undefined ? propsValue : (field.default !== undefined ? field.default : {});
                return typeof valToSerialize === 'object' ? JSON.stringify(valToSerialize, null, 2) : String(valToSerialize);
              })()}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setStatic(parsed);
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              className="w-full h-24 p-2 text-sm font-mono rounded-sm border border-input bg-muted/20 focus:ring-1 focus:ring-ring focus:outline-none resize-y"
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

          {/* Fallback for unknown kinds */}
          {!['string', 'number', 'color', 'nodeSelect', 'select', 'boolean', 'slider', 'segmented', 'radio', 'json', 'textarea', 'image'].includes(field.kind) && (
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

          onChange={(next) => {
            setFieldSelection(next);
            if (next?.dataSourceId && next.fieldPath) {
              setBindingExpr(makeFieldBindingExpression(next));
            }
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
            className="w-full h-16 p-2 text-sm font-mono rounded-sm border border-input bg-muted/20 focus:ring-1 focus:ring-ring focus:outline-none resize-none"
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
  onChange }: {
    kernelStore: KernelStore;
    currentNodeId: string;
    value: string;
    onChange: (nodeId: string) => void;

  }) {
  const { t } = useTranslation('editor');
  // 订阅 store 获取所有节点
  const nodesById = useSyncExternalStore(
    useCallback((cb) => kernelStore.subscribe(cb), [kernelStore]),
    () => (kernelStore.getState() as KernelState).nodesById
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
      className="w-full h-8 px-3 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
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
