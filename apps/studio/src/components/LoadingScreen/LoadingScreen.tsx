import { useState, useEffect } from 'react';
import './LoadingScreen.css';

export interface LoadingScreenProps {
  onComplete?: () => void;
}

const STATUS_TEXTS = [
  '初始化应用...',
  '加载可视化引擎...',
  '准备组件库...',
  '即将就绪...'
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete?.(), 300);
          return 100;
        }
        
        const remaining = 100 - p;
        const increment = Math.max(0.5, Math.min(remaining * 0.08, 8));
        const newProgress = Math.min(p + increment + Math.random() * 2, 100);
        
        const newIndex = Math.min(
          Math.floor((newProgress / 100) * STATUS_TEXTS.length),
          STATUS_TEXTS.length - 1
        );
        setStatusIndex(newIndex);
        
        return newProgress;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="loading-screen">
      <div className="logo-container">
        <div className="cube-layer cube-layer-1" />
        <div className="cube-layer cube-layer-2" />
        <div className="cube-layer cube-layer-3" />
      </div>

      <div className="brand-section">
        <div className="brand-name">ThingsVis</div>
        <div className="brand-tagline">可视化编辑器</div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          {STATUS_TEXTS[statusIndex]}
        </div>
      </div>
    </div>
  );
}
