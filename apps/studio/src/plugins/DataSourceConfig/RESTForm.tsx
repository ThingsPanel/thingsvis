import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RESTConfigSchema } from '@thingsvis/schema';

interface RESTFormProps {
  config: any;
  onChange: (config: any) => void;
  language: 'zh' | 'en';
}

export const RESTForm: React.FC<RESTFormProps> = ({ config, onChange, language }) => {
  const label = (zh: string, en: string) => language === 'zh' ? zh : en;

  const handleChange = (field: string, value: any) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm uppercase font-bold text-muted-foreground">
          {label('接口地址', 'API URL')}
        </Label>
        <Input 
          value={config.url || ''} 
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://api.example.com/data"
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm uppercase font-bold text-muted-foreground">
            {label('请求方法', 'Method')}
          </Label>
          <select
            value={config.method || 'GET'}
            onChange={(e) => handleChange('method', e.target.value)}
            className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm uppercase font-bold text-muted-foreground">
            {label('轮询间隔 (ms)', 'Polling (ms)')}
          </Label>
          <Input 
            type="number"
            value={config.pollingInterval || 0} 
            onChange={(e) => handleChange('pollingInterval', Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground italic">
        {label('提示：0 表示不轮询，仅执行一次。', 'Note: 0 means no polling, only fetch once.')}
      </p>
    </div>
  );
};

