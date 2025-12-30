import React, { useEffect, useMemo, useState } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import type { ControlField, DataBinding } from '@thingsvis/schema';
import { Input } from '@/components/ui/input';

import FieldPicker, { type FieldPickerValue } from './FieldPicker';
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
  language?: string;
};

function allowedModes(field: ControlField): BindingMode[] {
  const modes = field.binding?.enabled ? field.binding.modes : [];
  const normalized = modes.filter((m): m is BindingMode => m === 'static' || m === 'field' || m === 'expr');
  return normalized.length ? normalized : ['static'];
}

export function ControlFieldRow({ kernelStore, nodeId, field, propsValue, bindings, updateNode, language }: Props) {
  const t = (zh: string, en: string) => (language === 'zh' ? zh : en);
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
    updateNode({
      data: upsertBinding(bindings, { targetProp: field.path, expression })
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
        return t('静态', 'static');
      case 'field':
        return t('字段', 'field');
      case 'expr':
        return t('表达式', 'expr');
      default:
        return m;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-muted-foreground">{field.label}</label>

        {modes.length > 1 && (
          <select
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as BindingMode)}
            className="h-7 px-2 text-xs rounded-md border border-input bg-background min-w-20"
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
            />
          )}

          {field.kind === 'number' && (
            <Input
              type="number"
              value={typeof propsValue === 'number' ? propsValue : 0}
              onChange={(e) => setStatic(Number(e.target.value))}
              className="h-8 text-sm"
            />
          )}

          {field.kind === 'color' && (
            <div className="flex gap-2">
              <Input
                type="color"
                value={typeof propsValue === 'string' && propsValue ? propsValue : '#000000'}
                onChange={(e) => setStatic(e.target.value)}
                className="w-8 h-8 p-0 border-0 overflow-hidden rounded-md cursor-pointer"
              />
              <Input
                value={typeof propsValue === 'string' ? propsValue : ''}
                onChange={(e) => setStatic(e.target.value)}
                className="h-8 flex-1 text-sm font-mono"
              />
            </div>
          )}

          {field.kind !== 'string' && field.kind !== 'number' && field.kind !== 'color' && (
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
          language={language}
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
            className="w-full h-16 p-2 text-sm font-mono rounded-md border border-input bg-muted/20 focus:ring-1 focus:ring-ring focus:outline-none resize-none"
            placeholder="{{ ds.<id>.data.<path> }}"
          />
          {!exprIsValid && (
            <p className="text-xs text-destructive">
              {t('表达式必须使用 {{ }} 包裹。', 'Expression must be wrapped in {{ }}.')}
            </p>
          )}
        </>
      )}

      {showOverriddenHint && (
        <p className="text-xs text-muted-foreground italic">
          {t('静态值已被绑定覆盖。', 'Static value is overridden by binding.')}
        </p>
      )}
    </div>
  );
}

export default ControlFieldRow;
