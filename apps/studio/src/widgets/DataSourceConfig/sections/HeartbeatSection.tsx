/**
 * HeartbeatSection: WebSocket heartbeat/keep-alive configuration section
 * 
 * Provides controls for configuring periodic heartbeat messages
 * to keep the connection alive.
 * 
 * @feature 009-datasource-form-config
 * @user-story US4
 */

import React from 'react';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeartbeatConfig, DEFAULT_HEARTBEAT_CONFIG } from '@thingsvis/schema';
import { cn } from '@/lib/utils';

interface HeartbeatSectionProps {
  /** Current heartbeat configuration */
  heartbeat: HeartbeatConfig;
  /** Callback when heartbeat configuration changes */
  onChange: (heartbeat: HeartbeatConfig) => void;
  /** Current language */
}

const MIN_INTERVAL = 5;
const MAX_INTERVAL = 300;

export const HeartbeatSection: React.FC<HeartbeatSectionProps> = ({
  heartbeat,
  onChange}) => {
  const handleChange = <K extends keyof HeartbeatConfig>(
    field: K,
    value: HeartbeatConfig[K]
  ) => {
    onChange({ ...heartbeat, [field]: value });
  };

  const isIntervalValid = heartbeat.interval >= MIN_INTERVAL && heartbeat.interval <= MAX_INTERVAL;

  return (
    <FormSection
      title={t('datasource.heartbeat', 'Heartbeat')}
      description={t(
        heartbeat.enabled ? '心跳已启用' : '定期发送消息保持连接',
        heartbeat.enabled ? 'Heartbeat enabled' : 'Send periodic messages to keep connection alive'
      )}
      defaultCollapsed={!heartbeat.enabled}
    >
      <div className="space-y-4">
        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <Label>{t('datasource.enableHeartbeat', 'Enable Heartbeat')}</Label>
          <button
            type="button"
            onClick={() => handleChange('enabled', !heartbeat.enabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              heartbeat.enabled ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                heartbeat.enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {heartbeat.enabled && (
          <>
            {/* Interval */}
            <div className="space-y-2">
              <Label>{t('common.interval', 'Interval')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={MIN_INTERVAL}
                  max={MAX_INTERVAL}
                  value={heartbeat.interval}
                  onChange={(e) => handleChange('interval', parseInt(e.target.value) || 30)}
                  className={cn(
                    'w-20 h-8 text-sm',
                    !isIntervalValid && 'border-destructive'
                  )}
                />
                <span className="text-sm text-muted-foreground">{t('common.seconds', 'seconds')}</span>
              </div>
              {!isIntervalValid && (
                <p className="text-sm text-destructive">
                  {t(
                    `间隔必须在 ${MIN_INTERVAL}-${MAX_INTERVAL} 秒之间`,
                    `Interval must be between ${MIN_INTERVAL} and ${MAX_INTERVAL} seconds`
                  )}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>{t('datasource.heartbeatMessage', 'Heartbeat Message')}</Label>
              <Input
                value={heartbeat.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder={t('datasource.pingExample', 'e.g., ping or {"type":"ping"}')}
                className="h-8 text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  '可以是纯文本或 JSON 格式',
                  'Can be plain text or JSON format'
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </FormSection>
  );
};
