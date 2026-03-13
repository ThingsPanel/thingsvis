/**
 * ReconnectSection: WebSocket reconnection configuration section
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReconnectPolicy, DEFAULT_RECONNECT_POLICY } from '@thingsvis/schema';
import { cn } from '@/lib/utils';

interface ReconnectSectionProps {
  reconnect: ReconnectPolicy;
  onChange: (reconnect: ReconnectPolicy) => void;
}

export const ReconnectSection: React.FC<ReconnectSectionProps> = ({ reconnect, onChange }) => {
  const { t } = useTranslation('editor');

  const handleChange = <K extends keyof ReconnectPolicy>(field: K, value: ReconnectPolicy[K]) => {
    onChange({ ...reconnect, [field]: value });
  };

  const isMaxAttemptsValid = reconnect.maxAttempts >= 0 && reconnect.maxAttempts <= 100;
  const isInitialIntervalValid = reconnect.initialInterval >= 0.1 && reconnect.initialInterval <= 60;
  const isMaxIntervalValid = reconnect.maxInterval >= 1 && reconnect.maxInterval <= 300;

  return (
    <FormSection
      title={t('datasource.reconnectStrategy')}
      description={reconnect.enabled ? t('datasource.reconnectEnabled') : t('datasource.reconnectDisabled')}
      defaultCollapsed={!reconnect.enabled}
    >
      <div className="space-y-4">
        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <Label>{t('datasource.enableReconnect')}</Label>
          <button
            type="button"
            onClick={() => handleChange('enabled', !reconnect.enabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              reconnect.enabled ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                reconnect.enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {reconnect.enabled && (
          <>
            {/* Max Attempts */}
            <div className="space-y-2">
              <Label>{t('datasource.maxReconnect')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={reconnect.maxAttempts}
                  onChange={(e) => handleChange('maxAttempts', parseInt(e.target.value) || 0)}
                  className={cn('w-20 h-8 text-sm', !isMaxAttemptsValid && 'border-destructive')}
                />
                <span className="text-sm text-muted-foreground">{t('datasource.zeroUnlimited')}</span>
              </div>
            </div>

            {/* Initial Interval */}
            <div className="space-y-2">
              <Label>{t('datasource.initInterval')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0.1}
                  max={60}
                  step={0.1}
                  value={reconnect.initialInterval}
                  onChange={(e) => handleChange('initialInterval', parseFloat(e.target.value) || 1)}
                  className={cn('w-20 h-8 text-sm', !isInitialIntervalValid && 'border-destructive')}
                />
                <span className="text-sm text-muted-foreground">{t('common.seconds')}</span>
              </div>
            </div>

            {/* Exponential Backoff Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('datasource.exponentialBackoff')}</Label>
                <p className="text-xs text-muted-foreground">{t('datasource.doubleInterval')}</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('useExponentialBackoff', !reconnect.useExponentialBackoff)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  reconnect.useExponentialBackoff ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                    reconnect.useExponentialBackoff ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Max Interval */}
            {reconnect.useExponentialBackoff && (
              <div className="space-y-2">
                <Label>{t('datasource.maxInterval')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    value={reconnect.maxInterval}
                    onChange={(e) => handleChange('maxInterval', parseInt(e.target.value) || 60)}
                    className={cn('w-20 h-8 text-sm', !isMaxIntervalValid && 'border-destructive')}
                  />
                  <span className="text-sm text-muted-foreground">{t('common.seconds')}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </FormSection>
  );
};
