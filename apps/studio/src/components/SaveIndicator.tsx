/**
 * SaveIndicator Component
 *
 * Displays the current save status with visual feedback.
 * Shows saving spinner, saved checkmark, or error icon.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SaveStatus } from '../lib/storage/types';

// =============================================================================
// Props
// =============================================================================

export interface SaveIndicatorProps {
  /** Current save status */
  status: SaveStatus;
  /** Last saved timestamp (optional) */
  lastSavedAt?: number | null;
  /** Error message if status is 'error' */
  error?: string | null;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SaveIndicator({
  status,
  lastSavedAt: _lastSavedAt,
  error,
  className = '',
}: SaveIndicatorProps) {
  const { t } = useTranslation('editor');

  const getStatusText = (): string => {
    switch (status) {
      case 'dirty':
        return t('saveIndicator.unsaved');
      case 'saving':
        return t('saveIndicator.saving');
      case 'error':
        return error || t('saveIndicator.error');
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <SpinnerIcon className="animate-spin" />;
      case 'error':
        return <ErrorIcon className="text-red-500" />;
      case 'dirty':
        return <DotIcon className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const statusText = getStatusText();
  if (!statusText) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}
      title={status === 'error' ? error || undefined : undefined}
    >
      {getStatusIcon()}
      <span>{statusText}</span>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ErrorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DotIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export default SaveIndicator;
