/**
 * ProtocolsSection: WebSocket subprotocols configuration section
 * 
 * Provides input for configuring WebSocket subprotocols (Sec-WebSocket-Protocol).
 * Supports comma-separated input.
 * 
 * @feature 009-datasource-form-config
 * @user-story US6
 */

import React from 'react';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtocolsSectionProps {
  /** Current list of protocols */
  protocols: string[];
  /** Callback when protocols change */
  onChange: (protocols: string[]) => void;
  /** Current language */
  language: 'zh' | 'en';
}

export const ProtocolsSection: React.FC<ProtocolsSectionProps> = ({
  protocols,
  onChange,
  language,
}) => {
  const t = (zh: string, en: string) => (language === 'zh' ? zh : en);
  const [inputValue, setInputValue] = React.useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addProtocols();
    }
  };

  const handleInputBlur = () => {
    addProtocols();
  };

  const addProtocols = () => {
    const newProtocols = inputValue
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p && !protocols.includes(p));
    
    if (newProtocols.length > 0) {
      onChange([...protocols, ...newProtocols]);
    }
    setInputValue('');
  };

  const removeProtocol = (index: number) => {
    const newProtocols = protocols.filter((_, i) => i !== index);
    onChange(newProtocols);
  };

  return (
    <FormSection
      title={t('子协议', 'Subprotocols')}
      description={t(
        '配置 WebSocket 子协议 (Sec-WebSocket-Protocol)',
        'Configure WebSocket subprotocols (Sec-WebSocket-Protocol)'
      )}
      defaultCollapsed={protocols.length === 0}
    >
      <div className="space-y-3">
        {/* Protocol tags */}
        {protocols.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {protocols.map((protocol, index) => (
              <span
                key={index}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 text-sm',
                  'bg-muted rounded-sm'
                )}
              >
                <code className="font-mono">{protocol}</code>
                <button
                  type="button"
                  onClick={() => removeProtocol(index)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="space-y-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            placeholder={t(
              '输入协议名称，按 Enter 或逗号添加',
              'Enter protocol name, press Enter or comma to add'
            )}
            className="h-8 text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground">
            {t(
              '常见协议: graphql-ws, graphql-transport-ws, v10.stomp, soap',
              'Common: graphql-ws, graphql-transport-ws, v10.stomp, soap'
            )}
          </p>
        </div>
      </div>
    </FormSection>
  );
};
