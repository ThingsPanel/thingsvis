/**
 * HeartbeatSection: WebSocket heartbeat/keep-alive configuration section
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeartbeatConfig } from '@thingsvis/schema';
import { cn } from '@/lib/utils';

interface HeartbeatSectionProps {
  heartbeat: HeartbeatConfig;
  onChange: (heartbeat: HeartbeatConfig) => void;
}

const MIN_INTERVAL = 5;
const MAX_INTERVAL = 300;

export const HeartbeatSection: React.FC<HeartbeatSectionProps> = ({ heartbeat, onChange }) => {
  const { t } = useTranslation('editor');

  const handleChange = <K extends keyof HeartbeatConfig>(field: K, value: HeartbeatConfig[K]) => {
    onChange({ ...heartbeat, [field]: value });
  };

  const isIntervalValid = heartbeat.interval >= MIN_INTERVAL && heartbeat.interval <= MAX_INTERVAL;

  return (
    <FormSection
      title={t('datasource.heartbeat')}
      description={
        heartbeat.enabled ? t('datasource.heartbeatEnabled') : t('datasource.heartbeatDisabled')
      }
      defaultCollapsed={!heartbeat.enabled}
    >
      <div className="space-y-4">
        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <Label>{t('datasource.enableHeartbeat')}</Label>
          <button
            type="button"
            onClick={() => handleChange('enabled', !heartbeat.enabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              heartbeat.enabled ? 'bg-primary' : 'bg-muted',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                heartbeat.enabled ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>

        {heartbeat.enabled && (
          <>
            {/* Interval */}
            <div className="space-y-2">
              <Label>{t('common.interval')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={MIN_INTERVAL}
                  max={MAX_INTERVAL}
                  value={heartbeat.interval}
                  onChange={(e) => handleChange('interval', parseInt(e.target.value) || 30)}
                  className={cn('w-20 h-8 text-sm', !isIntervalValid && 'border-destructive')}
                />
                <span className="text-sm text-muted-foreground">{t('common.seconds')}</span>
              </div>
              {!isIntervalValid && (
                <p className="text-sm text-destructive">
                  {t('datasource.intervalError', { min: MIN_INTERVAL, max: MAX_INTERVAL })}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>{t('datasource.heartbeatMessage')}</Label>
              <Input
                value={heartbeat.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder={t('datasource.pingExample')}
                className="h-8 text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">{t('datasource.heartbeatFormat')}</p>
            </div>
          </>
        )}
      </div>
    </FormSection>
  );
};
