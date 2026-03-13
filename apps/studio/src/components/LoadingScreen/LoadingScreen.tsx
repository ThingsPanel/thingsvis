import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingScreen.css';

export interface LoadingScreenProps {
  progress?: number;
  statusText?: string;
}

const DEFAULT_PROGRESS = 24;

export default function LoadingScreen({
  progress = DEFAULT_PROGRESS,
  statusText,
}: LoadingScreenProps) {
  const { t } = useTranslation('common');
  const normalizedProgress = useMemo(
    () => Math.max(0, Math.min(100, Math.round(progress))),
    [progress],
  );

  return (
    <div className="loading-screen">
      <div className="logo-container">
        <div className="cube-layer cube-layer-1" />
        <div className="cube-layer cube-layer-2" />
        <div className="cube-layer cube-layer-3" />
      </div>

      <div className="brand-section">
        <div className="brand-name">ThingsVis</div>
        <div className="brand-tagline">{t('appName')}</div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${normalizedProgress}%` }} />
        </div>
        <div className="progress-text">{statusText ?? t('loadingScreen.starting')}</div>
      </div>
    </div>
  );
}
