/**
 * BodySection: Request body configuration section
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from '@/components/ui/FormSection';
import { JsonEditor } from '@/components/ui/JsonEditor';

interface BodySectionProps {
  body: string;
  onChange: (body: string) => void;
}

export const BodySection: React.FC<BodySectionProps> = ({ body, onChange }) => {
  const { t } = useTranslation('editor');

  return (
    <FormSection
      title={t('datasource.reqBody')}
      description={t('datasource.reqBodyDesc')}
      defaultCollapsed={!body}
    >
      <JsonEditor
        value={body}
        onChange={onChange}
        placeholder={'{\n  "key": "value"\n}'}
        minHeight="150px"
      />
    </FormSection>
  );
};
