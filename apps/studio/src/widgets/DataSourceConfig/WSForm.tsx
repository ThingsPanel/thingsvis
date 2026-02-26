import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WSConfig, DEFAULT_RECONNECT_POLICY, DEFAULT_HEARTBEAT_CONFIG } from '@thingsvis/schema';
import { ReconnectSection, HeartbeatSection, InitMessagesSection, ProtocolsSection } from './sections';

interface WSFormProps {
  config: WSConfig;
  onChange: (config: WSConfig) => void;
}

export const WSForm: React.FC<WSFormProps> = ({ config, onChange }) => {
  const { t } = useTranslation('editor');

  const handleChange = <K extends keyof WSConfig>(field: K, value: WSConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-sm uppercase font-bold text-muted-foreground">
            {t('datasource.wsUrl')} <span className="text-destructive">*</span>
          </Label>
          <Input
            value={config.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="ws://localhost:8080 or wss://example.com/ws"
            className="h-8 text-sm"
            required
          />
        </div>
      </div>

      <ProtocolsSection protocols={config.protocols ?? []} onChange={(protocols) => handleChange('protocols', protocols)} />
      <ReconnectSection reconnect={config.reconnect ?? DEFAULT_RECONNECT_POLICY} onChange={(reconnect) => handleChange('reconnect', reconnect)} />
      <HeartbeatSection heartbeat={config.heartbeat ?? DEFAULT_HEARTBEAT_CONFIG} onChange={(heartbeat) => handleChange('heartbeat', heartbeat)} />
      <InitMessagesSection initMessages={config.initMessages ?? []} onChange={(initMessages) => handleChange('initMessages', initMessages)} />
    </div>
  );
};
