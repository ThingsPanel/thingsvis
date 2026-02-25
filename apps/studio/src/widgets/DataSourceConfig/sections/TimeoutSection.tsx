/**
 * TimeoutSection: Request timeout configuration section
 * 
 * Provides a simple number input for configuring request timeout.
 * Range: 1-300 seconds.
 * 
 * @feature 009-datasource-form-config
 * @user-story US1
 */

import React from 'react';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TimeoutSectionProps {
  /** Current timeout value in seconds */
  timeout: number;
  /** Callback when timeout changes */
  onChange: (timeout: number) => void;
  /** Current language */
}

const MIN_TIMEOUT = 1;
const MAX_TIMEOUT = 300;
const DEFAULT_TIMEOUT = 30;

export const TimeoutSection: React.FC<TimeoutSectionProps> = ({
  timeout,
  onChange}) => {
  const isValid = timeout >= MIN_TIMEOUT && timeout <= MAX_TIMEOUT;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onChange(value);
    }
  };

  return (
    <FormSection
      title={t('超时设置', 'Timeout')}
      description={t(
        `请求超时时间 (${MIN_TIMEOUT}-${MAX_TIMEOUT} 秒)`,
        `Request timeout (${MIN_TIMEOUT}-${MAX_TIMEOUT} seconds)`
      )}
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
          <span className="text-sm text-muted-foreground">
            {t('秒', 'seconds')}
          </span>
        </div>
        {!isValid && (
          <p className="text-sm text-destructive">
            {t(
              `超时时间必须在 ${MIN_TIMEOUT}-${MAX_TIMEOUT} 秒之间`,
              `Timeout must be between ${MIN_TIMEOUT} and ${MAX_TIMEOUT} seconds`
            )}
          </p>
        )}
      </div>
    </FormSection>
  );
};
