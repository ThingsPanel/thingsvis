import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingScreen.css';

export interface LoadingScreenProps {
  onComplete?: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(t('loadingScreen.starting'));

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setStatusText(t('loadingScreen.completed'));
          setTimeout(() => onComplete?.(), 500);
          return 100;
        }
        
        // 随机进度增长，模拟真实加载
        const increment = Math.random() * 3 + 1;
        const newProgress = Math.min(p + increment, 100);
        
        // 根据进度更新状态文字
        if (newProgress > 30 && newProgress < 60) {
          setStatusText(t('loadingScreen.initEngine'));
        } else if (newProgress >= 60 && newProgress < 85) {
          setStatusText(t('loadingScreen.loadingComponents'));
        } else if (newProgress >= 85 && newProgress < 100) {
          setStatusText(t('loadingScreen.ready'));
        }
        
        return newProgress;
      });
    }, 80);

    return () => clearInterval(timer);
  }, [onComplete, t]);

  return (
    <div className="loading-screen">
      {/* Logo 波浪动画 */}
      <div className="logo-container">
        <div className="wave-layer wave-layer-1"></div>
        <div className="wave-layer wave-layer-2"></div>
        <div className="wave-layer wave-layer-3"></div>
      </div>

      <div className="brand-name">ThingsVis</div>

      <div className="progress-wrapper">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-info">
          <span className="status-text">{statusText}</span>
          <span className="progress-percent">{Math.floor(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
