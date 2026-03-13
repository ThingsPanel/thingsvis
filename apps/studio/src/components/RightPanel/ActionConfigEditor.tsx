/**
 * ActionConfigEditor — Multi-action configuration editor for widget events.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';

export type ActionType = 'setVariable' | 'callWrite' | 'navigate' | 'runScript';

export interface ActionConfigItem {
  type: ActionType;
  variableName?: string;
  value?: string;
  dataSourceId?: string;
  payload?: string;
  url?: string;
  script?: string;
}

import type { KernelStore, KernelState } from '@thingsvis/kernel';

interface ActionConfigEditorProps {
  actions: ActionConfigItem[];
  onChange: (actions: ActionConfigItem[]) => void;
  kernelStore: KernelStore;
}

const ACTION_TYPES: { value: ActionType; labelKey: string }[] = [
  { value: 'setVariable', labelKey: 'events.actionSetVariable' },
  { value: 'callWrite', labelKey: 'events.actionCallWrite' },
  { value: 'navigate', labelKey: 'events.actionNavigate' },
  { value: 'runScript', labelKey: 'events.actionRunScript' },
];

function ActionRow({
  action,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  variables,
  dataSources,
}: {
  action: ActionConfigItem;
  index: number;
  onChange: (index: number, action: ActionConfigItem) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  variables: { name: string; label?: string }[];
  dataSources: string[];
}) {
  const { t } = useTranslation('editor');
  const update = (partial: Partial<ActionConfigItem>) => onChange(index, { ...action, ...partial });

  return (
    <div className="bg-muted/30 rounded-md p-2 border border-border/40 space-y-2 relative group/action">
      <div className="flex items-center justify-between">
        <select
          value={action.type}
          onChange={(e) => update({ type: e.target.value as ActionType })}
          className="h-6 px-2 pr-6 text-[11px] font-medium rounded border border-transparent hover:border-border bg-transparent hover:bg-muted text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset w-32 cursor-pointer appearance-none transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 4px center',
            backgroundSize: '10px',
          }}
        >
          <option value="" disabled>
            {t('common.pleaseSelectAction', { defaultValue: 'Select Action' })}
          </option>
          {ACTION_TYPES.map((at) => (
            <option
              key={at.value}
              value={at.value}
              className="bg-background text-foreground text-xs"
            >
              {t(at.labelKey)}
            </option>
          ))}
        </select>
        <div className="flex gap-0.5 opacity-50 group-hover/action:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-muted"
            disabled={isFirst}
            onClick={() => onMoveUp(index)}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-muted"
            disabled={isLast}
            onClick={() => onMoveDown(index)}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-destructive/10 text-destructive"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {action.type === 'setVariable' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">{t('events.variableName')}</span>
            <select
              className="h-7 px-2 text-xs rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
              value={action.variableName ?? ''}
              onChange={(e) => update({ variableName: e.target.value })}
            >
              <option value="" disabled>
                {t('common.pleaseSelect', { defaultValue: 'Select' })}
              </option>
              {variables.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.label || v.name} ({v.name})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">{t('events.value')}</span>
            <Input
              className="h-7 text-xs"
              placeholder={t('events.value')}
              value={action.value ?? ''}
              onChange={(e) => update({ value: e.target.value })}
            />
          </div>
        </div>
      )}

      {action.type === 'callWrite' && (
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">{t('events.dataSourceId')}</span>
            <select
              className="h-7 px-2 text-xs rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
              value={action.dataSourceId ?? ''}
              onChange={(e) => update({ dataSourceId: e.target.value })}
            >
              <option value="" disabled>
                {t('common.pleaseSelect', { defaultValue: 'Select' })}
              </option>
              {dataSources.map((ds) => (
                <option key={ds} value={ds}>
                  {ds}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">{t('events.payload')}</span>
            <div
              className="rounded-md border border-input overflow-hidden bg-muted/20 resize-y"
              style={{ minHeight: 120, maxHeight: 400 }}
            >
              <CodeMirror
                value={action.payload ?? ''}
                height="100%"
                extensions={[javascript()]}
                className="h-full font-mono text-[13px] [&_.cm-content]:text-[13px] [&_.cm-gutters]:text-[13px] [&_.cm-content]:font-mono [&_.cm-gutters]:font-mono [&_.cm-editor]:h-full [&_.cm-scroller]:!overflow-auto"
                onChange={(val) => update({ payload: val })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground leading-tight">
                {t('events.payloadExprHint', {
                  defaultValue: 'Supports {{expr}} or JS expressions. Payload is the event value.',
                })}
              </span>
              <button
                type="button"
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap ml-2"
                onClick={() => {
                  try {
                    const formatted = JSON.stringify(JSON.parse(action.payload ?? '{}'), null, 2);
                    update({ payload: formatted });
                  } catch {
                    /* ignore invalid JSON */
                  }
                }}
              >
                Format
              </button>
            </div>
          </div>
        </div>
      )}

      {action.type === 'navigate' && (
        <Input
          className="h-7 text-xs"
          placeholder={t('events.url')}
          value={action.url ?? ''}
          onChange={(e) => update({ url: e.target.value })}
        />
      )}

      {action.type === 'runScript' && (
        <textarea
          className="w-full h-16 text-xs p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset focus:outline-none resize-none font-mono"
          placeholder={t('events.scriptPlaceholder')}
          value={action.script ?? ''}
          onChange={(e) => update({ script: e.target.value })}
        />
      )}
    </div>
  );
}

export default function ActionConfigEditor({
  actions,
  onChange,
  kernelStore,
}: ActionConfigEditorProps) {
  const { t } = useTranslation('editor');

  const state = React.useSyncExternalStore(
    React.useCallback((sub) => kernelStore.subscribe(sub), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );
  const variables = state.variableDefinitions ?? [];
  const dataSources = Object.keys(state.dataSources ?? {});

  const addAction = () => {
    onChange([...actions, { type: 'setVariable' }]);
  };

  const removeAction = (idx: number) => {
    onChange(actions.filter((_, i) => i !== idx));
  };

  const updateAction = (idx: number, action: ActionConfigItem) => {
    const next = [...actions];
    next[idx] = action;
    onChange(next);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...actions];
    const a = next[idx] as ActionConfigItem,
      b = next[idx - 1] as ActionConfigItem;
    next[idx - 1] = a;
    next[idx] = b;
    onChange(next);
  };

  const moveDown = (idx: number) => {
    if (idx >= actions.length - 1) return;
    const next = [...actions];
    const a = next[idx] as ActionConfigItem,
      b = next[idx + 1] as ActionConfigItem;
    next[idx] = b;
    next[idx + 1] = a;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {actions.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">{t('events.noActions')}</p>
      )}
      {actions.map((action, idx) => (
        <ActionRow
          key={idx}
          action={action}
          index={idx}
          onChange={updateAction}
          onRemove={removeAction}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
          isFirst={idx === 0}
          isLast={idx === actions.length - 1}
          variables={variables}
          dataSources={dataSources}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs gap-1"
        onClick={addAction}
      >
        <Plus className="h-3 w-3" />
        {t('events.addAction')}
      </Button>
    </div>
  );
}
