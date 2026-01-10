/**
 * 蓄水池组件
 * 
 * 功能：
 * - 水位高度可配置 (0-100%)
 * - 波浪动画效果
 * - 支持数据源绑定水位
 */

import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { PluginMainModule, PluginOverlayContext, PluginOverlayInstance } from './lib/types';

/**
 * 创建透明占位 Rect
 */
function create(): Rect {
  return new Rect({
    width: 120,
    height: 160,
    fill: 'transparent',
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 波浪动画组件
 */
const WaveAnimation: React.FC<{
  waterLevel: number;
  waterColor: string;
  waveHeight: number;
  waveSpeed: number;
  showWave: boolean;
}> = ({ waterLevel, waterColor, waveHeight, waveSpeed, showWave }) => {
  const wave1Ref = useRef<SVGPathElement>(null);
  const wave2Ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!showWave) return;

    let animationId: number;
    let phase = 0;

    const animate = () => {
      phase += 0.05 * waveSpeed;
      
      if (wave1Ref.current) {
        wave1Ref.current.setAttribute('d', generateWavePath(phase, waveHeight));
      }
      if (wave2Ref.current) {
        wave2Ref.current.setAttribute('d', generateWavePath(phase + Math.PI, waveHeight * 0.6));
      }
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [showWave, waveSpeed, waveHeight]);

  const generateWavePath = (phase: number, height: number) => {
    const points: string[] = [];
    const width = 200; // SVG viewBox width
    
    points.push(`M 0 ${height}`);
    
    for (let x = 0; x <= width; x += 5) {
      const y = Math.sin((x / width) * 4 * Math.PI + phase) * height + height;
      points.push(`L ${x} ${y}`);
    }
    
    points.push(`L ${width} 100`);
    points.push(`L 0 100`);
    points.push('Z');
    
    return points.join(' ');
  };

  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: `${waterLevel}%`,
        overflow: 'hidden',
      }}
    >
      {/* 第二层波浪（后面，颜色更浅） */}
      <path
        ref={wave2Ref}
        d={generateWavePath(Math.PI, waveHeight * 0.6)}
        fill={waterColor}
        opacity={0.5}
      />
      {/* 第一层波浪（前面） */}
      <path
        ref={wave1Ref}
        d={generateWavePath(0, waveHeight)}
        fill={waterColor}
        opacity={0.8}
      />
      {/* 水体主体 */}
      <rect x="0" y={waveHeight * 2} width="200" height={100 - waveHeight * 2} fill={waterColor} />
    </svg>
  );

  function generateWavePath(phase: number, height: number) {
    const points: string[] = [];
    const width = 200;
    
    points.push(`M 0 ${height}`);
    
    for (let x = 0; x <= width; x += 5) {
      const y = Math.sin((x / width) * 4 * Math.PI + phase) * height + height;
      points.push(`L ${x} ${y}`);
    }
    
    points.push(`L ${width} 100`);
    points.push(`L 0 100`);
    points.push('Z');
    
    return points.join(' ');
  }
};

/**
 * 蓄水池组件
 */
const WaterTank: React.FC<Props> = (props) => {
  const {
    waterLevel,
    waterColor,
    tankBackground,
    tankBorder,
    borderWidth,
    showWave,
    waveSpeed,
    waveHeight,
    showLabel,
    labelColor,
    opacity,
  } = props;

  // 限制水位在 0-100 之间
  const clampedLevel = Math.max(0, Math.min(100, waterLevel));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: tankBackground,
        border: `${borderWidth}px solid ${tankBorder}`,
        borderRadius: '4px',
        overflow: 'hidden',
        opacity,
        boxSizing: 'border-box',
      }}
    >
      {/* 水体 + 波浪 */}
      {showWave ? (
        <WaveAnimation
          waterLevel={clampedLevel}
          waterColor={waterColor}
          waveHeight={waveHeight}
          waveSpeed={waveSpeed}
          showWave={showWave}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: `${clampedLevel}%`,
            backgroundColor: waterColor,
            transition: 'height 0.5s ease-out',
          }}
        />
      )}

      {/* 水位刻度线 */}
      <div
        style={{
          position: 'absolute',
          right: '4px',
          top: '10%',
          bottom: '10%',
          width: '2px',
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
      >
        {[0, 25, 50, 75, 100].map((mark) => (
          <div
            key={mark}
            style={{
              position: 'absolute',
              right: '0',
              bottom: `${mark}%`,
              width: '8px',
              height: '1px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              transform: 'translateY(50%)',
            }}
          />
        ))}
      </div>

      {/* 水位标签 */}
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: labelColor,
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
        >
          {Math.round(clampedLevel)}%
        </div>
      )}
    </div>
  );
};

/**
 * 创建 DOM Overlay
 */
function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';

  let root: Root | null = null;

  const update = (ctx: PluginOverlayContext) => {
    const defaults = getDefaultProps();
    const props: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
    if (!root) {
      root = createRoot(element);
    }
    root.render(<WaterTank {...props} />);
  };

  // Initial render
  if (ctx.props) {
    update(ctx);
  }

  return {
    element,
    update,
    destroy: () => {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  };
}

export const Main: PluginMainModule = {
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  create,
  createOverlay,
  schema: PropsSchema,
  controls,
};

export default Main;
