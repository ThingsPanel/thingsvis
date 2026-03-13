/**
 * HeadersSection: HTTP headers configuration section
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@/components/ui/FormSection';
import { KeyValueEditor } from '@/components/ui/KeyValueEditor';
import { AuthConfig } from '@thingsvis/schema';

interface HeadersSectionProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
  auth?: AuthConfig;
}

export const HeadersSection: React.FC<HeadersSectionProps> = ({ headers, onChange, auth }) => {
  const { t } = useTranslation('editor');

  const authUsesHeader =
    auth?.type === 'bearer' ||
    auth?.type === 'basic' ||
    (auth?.type === 'apiKey' && auth?.location === 'header');

  const warningKeys = authUsesHeader
    ? ['Authorization', auth?.type === 'apiKey' ? auth.key : ''].filter(Boolean)
    : [];

  return (
    <FormSection
      title={t('datasource.headers')}
      description={t('datasource.addHeader')}
      defaultCollapsed={Object.keys(headers).length === 0}
    >
      <KeyValueEditor
        value={headers}
        onChange={onChange}
        keyPlaceholder={t('datasource.headerName')}
        valuePlaceholder={t('datasource.headerValue')}
        warningKeys={warningKeys}
        warningMessage={t('datasource.headerConflict')}
      />
    </FormSection>
  );
};
