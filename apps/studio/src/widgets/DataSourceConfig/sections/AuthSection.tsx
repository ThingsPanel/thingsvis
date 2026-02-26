/**
 * AuthSection: Authentication configuration section
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@/components/ui/FormSection';
import { AuthSelector } from '@/components/ui/AuthSelector';
import { AuthConfig } from '@thingsvis/schema';

interface AuthSectionProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

export const AuthSection: React.FC<AuthSectionProps> = ({ auth, onChange }) => {
  const { t } = useTranslation('editor');
  const hasAuth = auth.type !== 'none';

  return (
    <FormSection
      title={t('datasource.auth')}
      description={hasAuth ? t('datasource.authConfigured') : t('datasource.authDesc')}
      defaultCollapsed={!hasAuth}
      className="bg-card"
    >
      <AuthSelector value={auth} onChange={onChange} />
    </FormSection>
  );
};
