/**
 * ReconnectSection: WebSocket reconnection configuration section
 * 
 * Provides controls for configuring automatic reconnection with
 * exponential backoff.
 * 
 * @feature 009-datasource-form-config
 * @user-story US3
 */

import React from 'react';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReconnectPolicy, DEFAULT_RECONNECT_POLICY } from '@thingsvis/schema';
import { cn } from '@/lib/utils';

interface ReconnectSectionProps {
  /** Current reconnect policy configuration */
  reconnect: ReconnectPolicy;
  /** Callback when reconnect policy changes */
  onChange: (reconnect: ReconnectPolicy) => void;
  /** Current language */
}

export const ReconnectSection: React.FC<ReconnectSectionProps> = ({
  reconnect,
  onChange}) => {
  const handleChange = <K extends keyof ReconnectPolicy>(
    field: K,
    value: ReconnectPolicy[K]
  ) => {
    onChange({ ...reconnect, [field]: value });
  };

  // Validation
  const isMaxAttemptsValid = reconnect.maxAttempts >= 0 && reconnect.maxAttempts <= 100;
  const isInitialIntervalValid = reconnect.initialInterval >= 0.1 && reconnect.initialInterval <= 60;
  const isMaxIntervalValid = reconnect.maxInterval >= 1 && reconnect.maxInterval <= 300;

  return (
    <FormSection
      title={t('datasource.reconnectStrategy', 'Reconnection')}
      description={t(
        reconnect.enabled ? '自动重连已启用' : '自动重连已禁用',
        reconnect.enabled ? 'Auto-reconnect enabled' : 'Auto-reconnect disabled'
      )}
      defaultCollapsed={!reconnect.enabled}
    >
      <div className="space-y-4">
        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <Label>{t('datasource.enableReconnect', 'Enable Auto-Reconnect')}</Label>
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
              <Label>{t('datasource.maxReconnect', 'Max Attempts')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={reconnect.maxAttempts}
                  onChange={(e) => handleChange('maxAttempts', parseInt(e.target.value) || 0)}
                  className={cn(
                    'w-20 h-8 text-sm',
                    !isMaxAttemptsValid && 'border-destructive'
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {t('datasource.zeroUnlimited', '(0 = unlimited)')}
                </span>
              </div>
            </div>

            {/* Initial Interval */}
            <div className="space-y-2">
              <Label>{t('datasource.initInterval', 'Initial Interval')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0.1}
                  max={60}
                  step={0.1}
                  value={reconnect.initialInterval}
                  onChange={(e) => handleChange('initialInterval', parseFloat(e.target.value) || 1)}
                  className={cn(
                    'w-20 h-8 text-sm',
                    !isInitialIntervalValid && 'border-destructive'
                  )}
                />
                <span className="text-sm text-muted-foreground">{t('common.seconds', 'sec')}</span>
              </div>
            </div>

            {/* Exponential Backoff Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('datasource.exponentialBackoff', 'Exponential Backoff')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('datasource.doubleInterval', 'Double delay after each attempt')}
                </p>
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
                <Label>{t('datasource.maxInterval', 'Max Interval')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    value={reconnect.maxInterval}
                    onChange={(e) => handleChange('maxInterval', parseInt(e.target.value) || 60)}
                    className={cn(
                      'w-20 h-8 text-sm',
                      !isMaxIntervalValid && 'border-destructive'
                    )}
                  />
                  <span className="text-sm text-muted-foreground">{t('common.seconds', 'sec')}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </FormSection>
  );
};
