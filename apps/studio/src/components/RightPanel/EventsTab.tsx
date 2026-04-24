/**
 * EventsTab - Widget event handler configuration panel.
 */
import React, { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Zap } from 'lucide-react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ActionConfigEditor, { type ActionConfigItem } from './ActionConfigEditor';

interface EventsTabProps {
  nodeId: string;
  kernelStore: KernelStore;
  onUserEdit?: () => void;
}

/** Event handler config stored in node schema */
export interface EventHandlerConfig {
  event: string;
  actions: ActionConfigItem[];
}

type CommonEventOption = {
  value: string;
  label: string;
  shortLabel: string;
};

export default function EventsTab({ nodeId, kernelStore, onUserEdit }: EventsTabProps) {
  const { t } = useTranslation('editor');
  const commonEvents = useMemo<CommonEventOption[]>(
    () => [
      {
        value: 'click',
        shortLabel: t('events.common.clickShort', { defaultValue: 'Click' }),
        label: t('events.common.click', { defaultValue: 'Click (click)' }),
      },
      {
        value: 'dblclick',
        shortLabel: t('events.common.dblclickShort', { defaultValue: 'Double Click' }),
        label: t('events.common.dblclick', { defaultValue: 'Double Click (dblclick)' }),
      },
      {
        value: 'mouseenter',
        shortLabel: t('events.common.mouseenterShort', { defaultValue: 'Mouse Enter' }),
        label: t('events.common.mouseenter', { defaultValue: 'Mouse Enter (mouseenter)' }),
      },
      {
        value: 'mouseleave',
        shortLabel: t('events.common.mouseleaveShort', { defaultValue: 'Mouse Leave' }),
        label: t('events.common.mouseleave', { defaultValue: 'Mouse Leave (mouseleave)' }),
      },
      {
        value: 'change',
        shortLabel: t('events.common.changeShort', { defaultValue: 'Change' }),
        label: t('events.common.change', { defaultValue: 'Change (change)' }),
      },
      {
        value: 'submit',
        shortLabel: t('events.common.submitShort', { defaultValue: 'Submit' }),
        label: t('events.common.submit', { defaultValue: 'Submit (submit)' }),
      },
    ],
    [t],
  );

  const state = useSyncExternalStore(
    useCallback((sub) => kernelStore.subscribe(sub), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );

  const node = state.nodesById[nodeId];
  if (!node) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = node.schemaRef as any;
  const events: EventHandlerConfig[] = schema.events ?? [];

  const updateEvents = (next: EventHandlerConfig[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const st = kernelStore.getState() as any;
    st.updateNode?.(nodeId, { events: next });
    onUserEdit?.();
  };

  const addEvent = () => {
    updateEvents([...events, { event: 'click', actions: [] }]);
  };

  const removeEvent = (idx: number) => {
    updateEvents(events.filter((_, i) => i !== idx));
  };

  const updateEventName = (idx: number, name: string) => {
    const next = [...events];
    const cur = next[idx];
    if (!cur) return;
    next[idx] = { event: name, actions: cur.actions };
    updateEvents(next);
  };

  const updateEventActions = (idx: number, actions: ActionConfigItem[]) => {
    const next = [...events];
    const cur = next[idx];
    if (!cur) return;
    next[idx] = { event: cur.event, actions };
    updateEvents(next);
  };

  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          {t('events.title')}
        </h3>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1" onClick={addEvent}>
          <Plus className="h-3 w-3" />
          {t('events.addEvent')}
        </Button>
      </div>

      {events.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">{t('events.noEvents')}</p>
      )}

      <Accordion type="multiple" className="space-y-1">
        {events.map((handler, idx) => (
          <AccordionItem
            key={idx}
            value={`event-${idx}`}
            className="border-b border-border/50 px-3 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AccordionTrigger className="flex-1 py-3 text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground">
                    {commonEvents.find((eventOption) => eventOption.value === handler.event)
                      ?.shortLabel ?? handler.event}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground font-medium">
                    {handler.actions.length} {t('events.actionsCount')}
                  </span>
                </div>
              </AccordionTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100 hover:bg-destructive/10"
                onClick={() => removeEvent(idx)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
            <AccordionContent className="pb-3 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('events.eventName')}
                </label>
                <select
                  className="h-8 px-2 text-xs font-mono rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset w-full cursor-pointer appearance-none"
                  value={handler.event}
                  onChange={(e) => updateEventName(idx, e.target.value)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '12px',
                  }}
                >
                  <option value="" disabled>
                    {t('events.selectEvent', { defaultValue: '--- Select Event ---' })}
                  </option>
                  {commonEvents.map((evt) => (
                    <option key={evt.value} value={evt.value} className="font-sans">
                      {evt.label}
                    </option>
                  ))}
                  {!commonEvents.find((eventOption) => eventOption.value === handler.event) &&
                    handler.event && (
                      <option value={handler.event} className="font-sans">
                        {t('events.customEvent', {
                          event: handler.event,
                          defaultValue: 'Custom: {{event}}',
                        })}
                      </option>
                    )}
                </select>
              </div>
              <div className="pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-dashed bg-background shadow-xs"
                    >
                      {t('events.configureActions', {
                        count: handler.actions.length,
                        defaultValue: 'Configure Actions ({{count}})',
                      })}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {t('events.configureActionsTitle', {
                          event: handler.event,
                          defaultValue: 'Event Action Flow: {{event}}',
                        })}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <ActionConfigEditor
                        actions={handler.actions}
                        onChange={(acts) => updateEventActions(idx, acts)}
                        kernelStore={kernelStore}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
