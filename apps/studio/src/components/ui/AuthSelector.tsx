/**
 * AuthSelector: Authentication configuration selector
 * 
 * A reusable component for selecting and configuring authentication type.
 * Supports None, Bearer Token, Basic Auth, and API Key.
 * 
 * @feature 009-datasource-form-config
 */

import * as React from 'react';
import { AuthConfig } from '@thingsvis/schema';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';

export interface AuthSelectorProps {
  /** Current authentication configuration */
  value: AuthConfig;
  /** Callback when auth configuration changes */
  onChange: (value: AuthConfig) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

const AUTH_TYPES = [
  { value: 'none', label: '无认证' },
  { value: 'bearer', label: 'Bearer 令牌' },
  { value: 'basic', label: 'Basic 认证' },
  { value: 'apiKey', label: 'API 密钥' },
] as const;

const API_KEY_LOCATIONS = [
  { value: 'header', label: 'datasource.headers' },
  { value: 'query', label: '查询参数' },
] as const;

export function AuthSelector({
  value,
  onChange,
  disabled = false,
  className,
}: AuthSelectorProps) {
  const handleTypeChange = (type: AuthConfig['type']) => {
    switch (type) {
      case 'none':
        onChange({ type: 'none' });
        break;
      case 'bearer':
        onChange({ type: 'bearer', token: '' });
        break;
      case 'basic':
        onChange({ type: 'basic', username: '', password: '' });
        break;
      case 'apiKey':
        onChange({ type: 'apiKey', key: '', value: '', location: 'header' });
        break;
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Auth Type Selector */}
      <div className="space-y-2">
        <Label>认证类型</Label>
        <div className="flex flex-wrap gap-2">
          {AUTH_TYPES.map((authType) => (
            <button
              key={authType.value}
              type="button"
              onClick={() => handleTypeChange(authType.value)}
              disabled={disabled}
              className={cn(
                'px-3 py-1.5 text-sm rounded-sm border transition-colors',
                value.type === authType.value
                  ? 'bg-[#6965db]/10 text-[#6965db] border-[#6965db] font-medium'
                  : 'bg-white hover:bg-accent border-input text-muted-foreground',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {authType.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Fields Based on Auth Type */}
      {value.type === 'bearer' && (
        <div className="space-y-2">
          <Label htmlFor="auth-token">令牌</Label>
          <Input
            id="auth-token"
            type="password"
            value={value.token}
            onChange={(e) =>
              onChange({ ...value, token: e.target.value })
            }
            placeholder="请输入 Bearer 令牌"
            disabled={disabled}
          />
        </div>
      )}

      {value.type === 'basic' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="auth-username">用户名</Label>
            <Input
              id="auth-username"
              value={value.username}
              onChange={(e) =>
                onChange({ ...value, username: e.target.value })
              }
              placeholder="请输入用户名"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">密码</Label>
            <Input
              id="auth-password"
              type="password"
              value={value.password}
              onChange={(e) =>
                onChange({ ...value, password: e.target.value })
              }
              placeholder="请输入密码"
              disabled={disabled}
            />
          </div>
        </>
      )}

      {value.type === 'apiKey' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="auth-key-name">密钥名称</Label>
              <Input
                id="auth-key-name"
                value={value.key}
                onChange={(e) =>
                  onChange({ ...value, key: e.target.value })
                }
                placeholder="例如：X-API-Key"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-key-value">密钥值</Label>
              <Input
                id="auth-key-value"
                type="password"
                value={value.value}
                onChange={(e) =>
                  onChange({ ...value, value: e.target.value })
                }
                placeholder="请输入 API 密钥"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>密钥位置</Label>
            <div className="flex gap-2">
              {API_KEY_LOCATIONS.map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => onChange({ ...value, location: loc.value })}
                  disabled={disabled}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-sm border transition-colors',
                    value.location === loc.value
                      ? 'bg-[#6965db]/10 text-[#6965db] border-[#6965db] font-medium'
                      : 'bg-white hover:bg-accent border-input text-muted-foreground',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
