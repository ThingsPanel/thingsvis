/**
 * InitMessagesSection: WebSocket initial subscription messages section
 * 
 * Provides a list editor for configuring messages to send immediately
 * after WebSocket connection is established.
 * 
 * @feature 009-datasource-form-config
 * @user-story US5
 */

import React from 'react';
import { FormSection } from '@/components/ui/FormSection';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InitMessagesSectionProps {
  /** Current list of initial messages */
  initMessages: string[];
  /** Callback when messages change */
  onChange: (messages: string[]) => void;
  /** Current language */
}

export const InitMessagesSection: React.FC<InitMessagesSectionProps> = ({
  initMessages,
  onChange}) => {
  const handleAdd = () => {
    onChange([...initMessages, '']);
  };

  const handleRemove = (index: number) => {
    const newMessages = initMessages.filter((_, i) => i !== index);
    onChange(newMessages);
  };

  const handleChange = (index: number, value: string) => {
    const newMessages = [...initMessages];
    newMessages[index] = value;
    onChange(newMessages);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMessages = [...initMessages];
    const current = newMessages[index];
    const prev = newMessages[index - 1];
    if (current !== undefined && prev !== undefined) {
      newMessages[index - 1] = current;
      newMessages[index] = prev;
      onChange(newMessages);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index === initMessages.length - 1) return;
    const newMessages = [...initMessages];
    const current = newMessages[index];
    const next = newMessages[index + 1];
    if (current !== undefined && next !== undefined) {
      newMessages[index] = next;
      newMessages[index + 1] = current;
      onChange(newMessages);
    }
  };

  return (
    <FormSection
      title={t('datasource.initMessage', 'Initial Messages')}
      description={t(
        `连接后立即发送的消息 (${initMessages.length} 条)`,
        `Messages sent immediately after connection (${initMessages.length})`
      )}
      defaultCollapsed={initMessages.length === 0}
    >
      <div className="space-y-3">
        {initMessages.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            {t('datasource.noInitMessage', 'No messages. Click Add to create one.')}
          </p>
        )}

        {initMessages.map((message, index) => (
          <div key={index} className="flex gap-2">
            {/* Ordering controls */}
            <div className="flex flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="h-5 w-5"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleMoveDown(index)}
                disabled={index === initMessages.length - 1}
                className="h-5 w-5"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            {/* Message number badge */}
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium shrink-0 mt-2">
              {index + 1}
            </div>

            {/* Message textarea */}
            <textarea
              value={message}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={t(
                '例如: {"action":"subscribe","channel":"ticker"}',
                'e.g., {"action":"subscribe","channel":"ticker"}'
              )}
              className={cn(
                'flex-1 min-h-[60px] p-2 text-sm font-mono rounded-sm border',
                'bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring',
                'border-input'
              )}
            />

            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRemove(index)}
              className="shrink-0 text-muted-foreground hover:text-destructive mt-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('datasource.addMessage', 'Add Message')}
        </Button>
      </div>
    </FormSection>
  );
};
