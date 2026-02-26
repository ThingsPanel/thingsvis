/**
 * InitMessagesSection: WebSocket initial subscription messages section
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@/components/ui/FormSection';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InitMessagesSectionProps {
  initMessages: string[];
  onChange: (messages: string[]) => void;
}

export const InitMessagesSection: React.FC<InitMessagesSectionProps> = ({ initMessages, onChange }) => {
  const { t } = useTranslation('editor');

  const handleAdd = () => onChange([...initMessages, '']);

  const handleRemove = (index: number) => onChange(initMessages.filter((_, i) => i !== index));

  const handleChange = (index: number, value: string) => {
    const newMessages = [...initMessages];
    newMessages[index] = value;
    onChange(newMessages);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const msgs = [...initMessages];
    [msgs[index - 1], msgs[index]] = [msgs[index]!, msgs[index - 1]!];
    onChange(msgs);
  };

  const handleMoveDown = (index: number) => {
    if (index === initMessages.length - 1) return;
    const msgs = [...initMessages];
    [msgs[index], msgs[index + 1]] = [msgs[index + 1]!, msgs[index]!];
    onChange(msgs);
  };

  return (
    <FormSection
      title={t('datasource.initMessage')}
      description={t('datasource.initMessageDesc', { count: initMessages.length })}
      defaultCollapsed={initMessages.length === 0}
    >
      <div className="space-y-3">
        {initMessages.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">{t('datasource.noInitMessage')}</p>
        )}

        {initMessages.map((message, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex flex-col gap-0.5">
              <Button
                type="button" variant="ghost" size="icon-sm"
                onClick={() => handleMoveUp(index)} disabled={index === 0}
                className="h-5 w-5"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon-sm"
                onClick={() => handleMoveDown(index)} disabled={index === initMessages.length - 1}
                className="h-5 w-5"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium shrink-0 mt-2">
              {index + 1}
            </div>

            <textarea
              value={message}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={t('datasource.messagePlaceholder')}
              className={cn(
                'flex-1 min-h-[60px] p-2 text-sm font-mono rounded-sm border',
                'bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring border-input'
              )}
            />

            <Button
              type="button" variant="ghost" size="icon-sm"
              onClick={() => handleRemove(index)}
              className="shrink-0 text-muted-foreground hover:text-destructive mt-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button" variant="outline" size="sm"
          onClick={handleAdd} className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('datasource.addMessage')}
        </Button>
      </div>
    </FormSection>
  );
};
