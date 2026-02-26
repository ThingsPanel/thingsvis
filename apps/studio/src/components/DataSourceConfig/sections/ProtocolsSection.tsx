/**
 * ProtocolsSection: WebSocket subprotocols configuration section
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtocolsSectionProps {
  protocols: string[];
  onChange: (protocols: string[]) => void;
}

export const ProtocolsSection: React.FC<ProtocolsSectionProps> = ({ protocols, onChange }) => {
  const { t } = useTranslation('editor');
  const [inputValue, setInputValue] = React.useState('');

  const addProtocols = () => {
    const newProtocols = inputValue
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p && !protocols.includes(p));
    if (newProtocols.length > 0) onChange([...protocols, ...newProtocols]);
    setInputValue('');
  };

  const removeProtocol = (index: number) => {
    onChange(protocols.filter((_, i) => i !== index));
  };

  return (
    <FormSection
      title={t('datasource.subProtocol')}
      description={t('datasource.subProtocolDesc')}
      defaultCollapsed={protocols.length === 0}
    >
      <div className="space-y-3">
        {protocols.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {protocols.map((protocol, index) => (
              <span
                key={index}
                className={cn('inline-flex items-center gap-1 px-2 py-1 text-sm', 'bg-muted rounded-sm')}
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

        <div className="space-y-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addProtocols(); } }}
            onBlur={addProtocols}
            placeholder={t('datasource.subProtocolPlaceholder')}
            className="h-8 text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground">{t('datasource.subProtocolHint')}</p>
        </div>
      </div>
    </FormSection>
  );
};
