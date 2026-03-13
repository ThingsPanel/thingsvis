import React from 'react';
import type { AdapterStatus } from '@thingsvis/schema';

interface DataSourceStatusBadgeProps {
  status: AdapterStatus | string | undefined;
  /** Show compact dot-only mode (no text label) */
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; pulse?: boolean }> = {
  connected: { dot: 'bg-green-500', label: '已连接', pulse: true },
  loading: { dot: 'bg-yellow-400', label: '连接中', pulse: true },
  error: { dot: 'bg-red-500', label: '错误' },
  idle: { dot: 'bg-gray-400', label: '空闲' },
  disconnected: { dot: 'bg-gray-500', label: '已断开' },
};

/**
 * DataSourceStatusBadge — displays a colored dot (+ optional text) for a
 * data source adapter's connection status.
 *
 * Used in the DataSourceConfig panels and the source list sidebar.
 */
export const DataSourceStatusBadge: React.FC<DataSourceStatusBadgeProps> = ({
  status,
  compact = false,
  className = '',
}) => {
  const statusKey = String(status ?? 'idle');
  const cfg = (STATUS_CONFIG[statusKey] ?? STATUS_CONFIG['idle'])!;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={cfg.label}
      aria-label={`连接状态: ${cfg.label}`}
    >
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
      </span>
      {!compact && <span className="text-xs text-muted-foreground leading-none">{cfg.label}</span>}
    </span>
  );
};
