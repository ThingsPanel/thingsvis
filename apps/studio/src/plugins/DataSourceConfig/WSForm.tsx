import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WSConfig, DEFAULT_RECONNECT_POLICY, DEFAULT_HEARTBEAT_CONFIG } from '@thingsvis/schema';
import { 
  ReconnectSection, 
  HeartbeatSection, 
  InitMessagesSection, 
  ProtocolsSection 
} from './sections';

interface WSFormProps {
  config: WSConfig;
  onChange: (config: WSConfig) => void;
  language: 'zh' | 'en';
}

export const WSForm: React.FC<WSFormProps> = ({ config, onChange, language }) => {
  const label = (zh: string, en: string) => language === 'zh' ? zh : en;

  const handleChange = <K extends keyof WSConfig>(field: K, value: WSConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Basic Settings - Always visible */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-sm uppercase font-bold text-muted-foreground">
            {label('WebSocket 地址', 'WS URL')} <span className="text-destructive">*</span>
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

      {/* Subprotocols Section */}
      <ProtocolsSection
        protocols={config.protocols ?? []}
        onChange={(protocols) => handleChange('protocols', protocols)}
        language={language}
      />

      {/* Reconnection Section */}
      <ReconnectSection
        reconnect={config.reconnect ?? DEFAULT_RECONNECT_POLICY}
        onChange={(reconnect) => handleChange('reconnect', reconnect)}
        language={language}
      />

      {/* Heartbeat Section */}
      <HeartbeatSection
        heartbeat={config.heartbeat ?? DEFAULT_HEARTBEAT_CONFIG}
        onChange={(heartbeat) => handleChange('heartbeat', heartbeat)}
        language={language}
      />

      {/* Initial Messages Section */}
      <InitMessagesSection
        initMessages={config.initMessages ?? []}
        onChange={(initMessages) => handleChange('initMessages', initMessages)}
        language={language}
      />
    </div>
  );
};

