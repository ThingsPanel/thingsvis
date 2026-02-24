/**
 * BodySection: Request body configuration section
 * 
 * Provides a JSON editor for configuring request body for POST/PUT requests.
 * Includes real-time JSON validation.
 * 
 * @feature 009-datasource-form-config
 * @user-story US2
 */

import React from 'react';
import { FormSection } from '@/components/ui/FormSection';
import { JsonEditor } from '@/components/ui/JsonEditor';

interface BodySectionProps {
  /** Current body value (JSON string) */
  body: string;
  /** Callback when body changes */
  onChange: (body: string) => void;
  /** Current language */
  language: 'zh' | 'en';
}

export const BodySection: React.FC<BodySectionProps> = ({
  body,
  onChange,
  language,
}) => {
  const t = (zh: string, en: string) => (language === 'zh' ? zh : en);

  return (
    <FormSection
      title={t('请求体', 'Request Body')}
      description={t(
        '以 JSON 格式配置请求体内容',
        'Configure request body in JSON format'
      )}
      defaultCollapsed={!body}
    >
      <JsonEditor
        value={body}
        onChange={onChange}
        placeholder={t(
          '{\n  "key": "value"\n}',
          '{\n  "key": "value"\n}'
        )}
        minHeight="150px"
      />
    </FormSection>
  );
};
