/**
 * AuthSection: Authentication configuration section
 * 
 * Provides a form section for configuring REST API authentication.
 * Supports None, Bearer Token, Basic Auth, and API Key.
 * 
 * @feature 009-datasource-form-config
 * @user-story US1
 */

import React from 'react';
import { FormSection } from '@/components/ui/FormSection';
import { AuthSelector } from '@/components/ui/AuthSelector';
import { AuthConfig, DEFAULT_AUTH_CONFIG } from '@thingsvis/schema';

interface AuthSectionProps {
  /** Current authentication configuration */
  auth: AuthConfig;
  /** Callback when auth configuration changes */
  onChange: (auth: AuthConfig) => void;
  /** Current language */
}

export const AuthSection: React.FC<AuthSectionProps> = ({
  auth,
  onChange}) => {
  // Determine if auth is configured (not 'none')
  const hasAuth = auth.type !== 'none';

  return (
    <FormSection
      title={t('datasource.auth', 'Authentication')}
      description={t(
        hasAuth ? '已配置认证方式' : '配置 API 访问认证',
        hasAuth ? 'Authentication configured' : 'Configure API authentication'
      )}
      defaultCollapsed={!hasAuth}
      className="bg-card"
    >
      <AuthSelector
        value={auth}
        onChange={onChange}
      />
    </FormSection>
  );
};
