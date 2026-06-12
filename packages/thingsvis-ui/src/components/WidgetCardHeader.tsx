import React from 'react';
import type { ICardStyle } from '@thingsvis/schema';
import { resolveCardTitle, shouldShowCardHeader } from '../utils/cardStyle';

export interface WidgetCardHeaderProps {
  card?: ICardStyle;
  nodeName?: string;
  titleColor?: string;
  subtitleColor?: string;
}

export const WidgetCardHeader: React.FC<WidgetCardHeaderProps> = ({
  card,
  nodeName,
  titleColor = '#0f172a',
  subtitleColor = 'rgba(100, 116, 139, 0.9)',
}) => {
  if (!shouldShowCardHeader(card, nodeName)) return null;

  const title = resolveCardTitle(card, nodeName);
  const subtitle = card?.subtitle?.trim() ?? '';
  const showSubtitle = card?.showSubtitle === true && !!subtitle;

  return (
    <div style={{ flex: '0 0 auto', marginBottom: 12 }}>
      {title ? (
        <div
          style={{
            fontSize: card?.titleFontSize ?? 16,
            fontWeight: 600,
            lineHeight: 1.2,
            color: titleColor,
            fontFamily: 'Inter, "Noto Sans SC", "Noto Sans", sans-serif',
          }}
        >
          {title}
        </div>
      ) : null}
      {showSubtitle ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            lineHeight: 1.4,
            color: subtitleColor,
            fontFamily: 'Inter, "Noto Sans SC", "Noto Sans", sans-serif',
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};
