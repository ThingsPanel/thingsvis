/**
 * TimeoutSection: Request timeout configuration section
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TimeoutSectionProps {
  timeout: number;
  onChange: (timeout: number) => void;
}

const MIN_TIMEOUT = 1;
const MAX_TIMEOUT = 300;
const DEFAULT_TIMEOUT = 30;

export const TimeoutSection: React.FC<TimeoutSectionProps> = ({ timeout, onChange }) => {
  const { t } = useTranslation('editor');
  const isValid = timeout >= MIN_TIMEOUT && timeout <= MAX_TIMEOUT;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) onChange(value);
  };

  return (
    <FormSection
      title={t('datasource.timeout')}
      description={t('datasource.timeoutDesc', { min: MIN_TIMEOUT, max: MAX_TIMEOUT })}
      defaultCollapsed={timeout === DEFAULT_TIMEOUT}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={MIN_TIMEOUT}
            max={MAX_TIMEOUT}
            value={timeout}
            onChange={handleChange}
            className={cn(
              'w-24 h-8 text-sm',
              !isValid && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          <span className="text-sm text-muted-foreground">{t('common.seconds')}</span>
        </div>
        {!isValid && (
          <p className="text-sm text-destructive">
            {t('datasource.timeoutError', { min: MIN_TIMEOUT, max: MAX_TIMEOUT })}
          </p>
        )}
      </div>
    </FormSection>
  );
};
