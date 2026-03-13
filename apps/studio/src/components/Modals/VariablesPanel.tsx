/**
 * VariablesPanel — Global variable management dialog.
 */
import React, { useCallback, useState, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Variable } from 'lucide-react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import type { DashboardVariable, VariableValueType } from '@thingsvis/kernel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VariablesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: KernelStore;
  onDirty?: (immediate?: boolean) => void;
}

const VARIABLE_TYPES: VariableValueType[] = ['string', 'number', 'boolean', 'object', 'array'];

// Stable empty array to avoid useSyncExternalStore getSnapshot returning new reference each call
const EMPTY_VARIABLE_DEFS: DashboardVariable[] = [];

function getDefaultForType(type: VariableValueType): unknown {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    case 'array':
      return [];
  }
}

export function VariablesPanel({ open, onOpenChange, store, onDirty }: VariablesPanelProps) {
  const { t } = useTranslation('editor');

  const variableDefinitions = useSyncExternalStore(
    useCallback((sub) => store.subscribe(sub), [store]),
    useCallback(
      () => (store.getState() as KernelState).variableDefinitions ?? EMPTY_VARIABLE_DEFS,
      [store],
    ),
  );

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<DashboardVariable>>({});
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitDefinitions = (defs: DashboardVariable[], immediate = false) => {
    store.getState().setVariableDefinitions(defs);
    store.getState().initVariablesFromDefinitions(defs);
    onDirty?.(immediate);
  };

  const handleAdd = () => {
    const name = `var_${Date.now().toString(36)}`;
    const newVar: DashboardVariable = { name, type: 'string', defaultValue: '' };
    commitDefinitions([...variableDefinitions, newVar]);
    setEditingIdx(variableDefinitions.length);
    setDraft(newVar);
  };

  const handleDelete = (idx: number) => {
    const next = variableDefinitions.filter((_, i) => i !== idx);
    commitDefinitions(next);
    if (editingIdx === idx) {
      setEditingIdx(null);
      setDraft({});
    }
  };

  const handleSelect = (idx: number) => {
    setEditingIdx(idx);
    setDraft({ ...variableDefinitions[idx] });
  };

  const handleDraftChange = (field: keyof DashboardVariable, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (editingIdx == null || !draft.name) return;
    const next = [...variableDefinitions];
    next[editingIdx] = {
      name: draft.name,
      type: draft.type ?? 'string',
      defaultValue: draft.defaultValue ?? getDefaultForType(draft.type ?? 'string'),
      label: draft.label,
      persistent: draft.persistent,
    };
    commitDefinitions(next, true); // Use immediate save for manual "Save" button
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            {t('variables.title')}
          </DialogTitle>
          <DialogDescription>
            {t('variables.description')}
            <br />
            <span className="font-mono text-xs text-muted-foreground mt-1 block">
              💡 纯引用 (保持原始类型): <code>{'{{ var.变量名 }}'}</code> <br />
              💡 文本混合拼接: <code>{'文本 {{ var.变量名 }} 文本'}</code>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mt-4">
          <div className="w-1/2 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('variables.list')}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1"
                onClick={handleAdd}
              >
                <Plus className="h-3 w-3" />
                {t('variables.add')}
              </Button>
            </div>
            {variableDefinitions.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('variables.empty')}
              </p>
            )}
            {variableDefinitions.map((v, idx) => (
              <div
                key={v.name}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${editingIdx === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
                onClick={() => handleSelect(idx)}
              >
                <div>
                  <span className="font-mono text-xs">{v.name}</span>
                  <span className="ml-2 text-muted-foreground text-xs">{v.type}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(idx);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="w-1/2 space-y-3 pl-4 border-l border-border">
            {editingIdx != null ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('variables.name')}
                  </label>
                  <Input
                    value={draft.name ?? ''}
                    onChange={(e) => handleDraftChange('name', e.target.value)}
                    className="h-8 text-sm font-mono"
                    placeholder="myVariable"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('variables.label')}
                  </label>
                  <Input
                    value={(draft.label as string) ?? ''}
                    onChange={(e) => handleDraftChange('label', e.target.value)}
                    className="h-8 text-sm"
                    placeholder={t('variables.labelPlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('variables.type')}
                  </label>
                  <select
                    value={draft.type ?? 'string'}
                    onChange={(e) => {
                      const v = e.target.value as VariableValueType;
                      handleDraftChange('type', v);
                      handleDraftChange('defaultValue', getDefaultForType(v));
                    }}
                    className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {VARIABLE_TYPES.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('variables.defaultValue')}
                  </label>
                  <Input
                    value={
                      typeof draft.defaultValue === 'object'
                        ? JSON.stringify(draft.defaultValue)
                        : String(draft.defaultValue ?? '')
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      const type = draft.type ?? 'string';
                      if (type === 'number') handleDraftChange('defaultValue', Number(raw) || 0);
                      else if (type === 'boolean')
                        handleDraftChange('defaultValue', raw === 'true');
                      else if (type === 'object' || type === 'array') {
                        try {
                          handleDraftChange('defaultValue', JSON.parse(raw));
                        } catch {
                          handleDraftChange('defaultValue', raw);
                        }
                      } else handleDraftChange('defaultValue', raw);
                    }}
                    className="h-8 text-sm font-mono"
                    placeholder="..."
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className={`mt-2 w-full transition-colors ${saved ? 'bg-green-600 hover:bg-green-600 text-white' : ''}`}
                  onClick={handleSave}
                >
                  {saved ? '✓ ' + t('variables.saved') : t('variables.save')}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t('variables.selectHint')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
