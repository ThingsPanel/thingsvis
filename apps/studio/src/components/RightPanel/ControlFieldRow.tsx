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
};

function allowedModes(field: ControlField): BindingMode[] {
  const modes = field.binding?.enabled ? field.binding.modes : [];
  const normalized = modes.filter((m): m is BindingMode => m === 'static' || m === 'field' || m === 'expr');
  return normalized.length ? normalized : ['static'];
}

export function ControlFieldRow({ kernelStore, nodeId, field, propsValue, bindings, updateNode }: Props) {
  const modes = useMemo(() => allowedModes(field), [field]);

  const persistedMode = useMemo(() => detectBindingMode(bindings, field.path), [bindings, field.path]);
  const binding = useMemo(() => getBinding(bindings, field.path), [bindings, field.path]);

  const [mode, setMode] = useState<BindingMode>(persistedMode);

  const [fieldSelection, setFieldSelection] = useState<FieldPickerValue | null>(() => {
    if (binding) return parseFieldBindingExpression(binding.expression);
    return null;
  });

  const [exprDraft, setExprDraft] = useState<string>(() => binding?.expression ?? '{{ }}');

  const exprIsValid = useMemo(() => isValidExpression(exprDraft), [exprDraft]);

  useEffect(() => {
    setMode(persistedMode);
    if (persistedMode === 'field') {
      setFieldSelection(binding ? parseFieldBindingExpression(binding.expression) : null);
    }
    if (persistedMode === 'expr') {
      setExprDraft(binding?.expression ?? '{{ }}');
    }
  }, [persistedMode, binding]);

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
      const initial = binding?.expression ?? exprDraft;
      if (isValidExpression(initial)) {
        setBindingExpr(initial);
      }
    }

    // For 'field', we wait for a concrete FieldPicker selection to persist.
  };

  const showOverriddenHint = mode !== 'static' && propsValue !== undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-muted-foreground">{field.label}</label>

        {modes.length > 1 && (
          <select
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as BindingMode)}
            className="h-7 px-2 text-xs rounded-md border border-input bg-background"
          >
            {modes.map((m) => (
              <option key={m} value={m}>
                {m}
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
            placeholder="{{ ds.id.data.path }}"
          />
          {!exprIsValid && (
            <p className="text-xs text-destructive">
              Expression must be wrapped in {"{{ }}"}.
            </p>
          )}
        </>
      )}

      {showOverriddenHint && (
        <p className="text-xs text-muted-foreground italic">
          Static value is overridden by binding.
        </p>
      )}
    </div>
  );
}

export default ControlFieldRow;
