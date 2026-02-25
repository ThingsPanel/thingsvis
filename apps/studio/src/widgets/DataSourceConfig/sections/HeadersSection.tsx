/**
 * HeadersSection: HTTP headers configuration section
 * 
 * Provides a key-value editor for configuring custom HTTP headers
 * with automatic warning for Authorization header conflicts.
 * 
 * @feature 009-datasource-form-config
 * @user-story US1
 */

import React from 'react';
import { FormSection } from '@/components/ui/FormSection';
import { KeyValueEditor } from '@/components/ui/KeyValueEditor';
import { AuthConfig } from '@thingsvis/schema';

interface HeadersSectionProps {
  /** Current headers configuration */
  headers: Record<string, string>;
  /** Callback when headers change */
  onChange: (headers: Record<string, string>) => void;
  /** Current auth configuration (for conflict detection) */
  auth?: AuthConfig;
  /** Current language */
}

export const HeadersSection: React.FC<HeadersSectionProps> = ({
  headers,
  onChange,
  auth}) => {
  // Detect if auth is set and would conflict with manual Authorization header
  const authUsesHeader = auth?.type === 'bearer' || auth?.type === 'basic' || 
    (auth?.type === 'apiKey' && auth?.location === 'header');
  
  const warningKeys = authUsesHeader ? ['Authorization', auth?.type === 'apiKey' ? auth.key : ''].filter(Boolean) : [];

  return (
    <FormSection
      title={t('请求头', 'Headers')}
      description={t('添加自定义 HTTP 请求头', 'Add custom HTTP headers')}
      defaultCollapsed={Object.keys(headers).length === 0}
    >
      <KeyValueEditor
        value={headers}
        onChange={onChange}
        keyPlaceholder={t('请求头名称', 'Header Name')}
        valuePlaceholder={t('请求头值', 'Header Value')}
        warningKeys={warningKeys}
        warningMessage={t(
          '此请求头将与认证配置冲突，认证配置优先',
          'This header may conflict with auth settings. Auth takes precedence.'
        )}
      />
    </FormSection>
  );
};
