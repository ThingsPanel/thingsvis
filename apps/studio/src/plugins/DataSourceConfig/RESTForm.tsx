import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RESTConfig, AuthConfig, DEFAULT_AUTH_CONFIG } from '@thingsvis/schema';
import { HeadersSection, AuthSection, TimeoutSection, BodySection } from './sections';

interface RESTFormProps {
  config: RESTConfig;
  onChange: (config: RESTConfig) => void;
  language: 'zh' | 'en';
}

export const RESTForm: React.FC<RESTFormProps> = ({ config, onChange, language }) => {
  const label = (zh: string, en: string) => language === 'zh' ? zh : en;

  const handleChange = <K extends keyof RESTConfig>(field: K, value: RESTConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  // Determine if body section should be visible (POST/PUT/DELETE methods)
  const showBodySection = config.method !== 'GET';

  return (
    <div className="space-y-4">
      {/* Basic Settings - Always visible */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-sm uppercase font-bold text-muted-foreground">
            {label('接口地址', 'API URL')} <span className="text-destructive">*</span>
          </Label>
          <Input 
            value={config.url || ''} 
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://api.example.com/data"
            className="h-8 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm uppercase font-bold text-muted-foreground">
              {label('请求方法', 'Method')}
            </Label>
            <select
              value={config.method || 'GET'}
              onChange={(e) => handleChange('method', e.target.value as RESTConfig['method'])}
              className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm uppercase font-bold text-muted-foreground">
              {label('轮询间隔 (s)', 'Polling (s)')}
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

      {/* Authentication Section */}
      <AuthSection
        auth={config.auth ?? DEFAULT_AUTH_CONFIG}
        onChange={(auth) => handleChange('auth', auth)}
        language={language}
      />

      {/* Headers Section */}
      <HeadersSection
        headers={config.headers ?? {}}
        onChange={(headers) => handleChange('headers', headers)}
        auth={config.auth}
        language={language}
      />

      {/* Body Section - Only for POST/PUT/DELETE */}
      {showBodySection && (
        <BodySection
          body={config.body ?? ''}
          onChange={(body) => handleChange('body', body)}
          language={language}
        />
      )}

      {/* Timeout Section */}
      <TimeoutSection
        timeout={config.timeout ?? 30}
        onChange={(timeout) => handleChange('timeout', timeout)}
        language={language}
      />
    </div>
  );
};

