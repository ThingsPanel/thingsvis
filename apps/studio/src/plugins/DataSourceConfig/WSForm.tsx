import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WSFormProps {
  config: any;
  onChange: (config: any) => void;
  language: 'zh' | 'en';
}

export const WSForm: React.FC<WSFormProps> = ({ config, onChange, language }) => {
  const label = (zh: string, en: string) => language === 'zh' ? zh : en;

  const handleChange = (field: string, value: any) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground">
          {label('WebSocket 地址', 'WS URL')}
        </Label>
        <Input 
          value={config.url || ''} 
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="ws://localhost:8080"
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground">
          {label('重连尝试次数', 'Reconnect Attempts')}
        </Label>
        <Input 
          type="number"
          value={config.reconnectAttempts || 5} 
          onChange={(e) => handleChange('reconnectAttempts', Number(e.target.value))}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
};

