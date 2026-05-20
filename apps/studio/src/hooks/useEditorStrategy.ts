/**
 * useEditorStrategy Hook
 *
 * Phase 1: 根据当前 URL / 运行环境自动选择 EditorStrategy 实例。
 *
 * 选择逻辑:
 * - URL 含 saveTarget=host 或 mode=embedded + Host 管理项目 → WidgetModeStrategy
 * - 其他 (嵌入 + saveTarget=self, 独立运行) → AppModeStrategy
 */

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import type { EditorStrategy } from '../strategies/EditorStrategy';
import { AppModeStrategy } from '../strategies/AppModeStrategy';
import { WidgetModeStrategy } from '../strategies/WidgetModeStrategy';
import { createCloudStorageAdapter } from '../lib/storage/adapter';
import { isEmbedMode } from '../embed/message-router';
import { getMergedEditorUrlParams } from '../lib/embed/editorUrlParams';
import { resolveEditorServiceConfig } from '../lib/embedded/service-config';
import { shouldUseWidgetMode } from './editorStrategyMode';

interface UseEditorStrategyResult {
  strategy: EditorStrategy;
  isWidget: boolean;
  isApp: boolean;
}

export function useEditorStrategy(projectId?: string): UseEditorStrategyResult {
  const { isAuthenticated, storageMode } = useAuth();

  const strategy = useMemo<EditorStrategy>(() => {
    const embedded = isEmbedMode();

    const params = getMergedEditorUrlParams();
    const saveTarget = params.get('saveTarget') || 'self';
    const serviceConfig = resolveEditorServiceConfig();

    // Widget Mode is reserved for host-owned widget/template editors.
    // Dashboard embeds still use the normal editor autosave pipeline; the
    // save target is handled later by SaveStrategy/useAutoSave.
    if (shouldUseWidgetMode({ embedded, saveTarget, context: serviceConfig.context })) {
      return new WidgetModeStrategy();
    }

    // App Mode: 独立运行 或 嵌入 + saveTarget=self
    const shouldUseCloud = isAuthenticated && (storageMode === 'cloud' || storageMode === 'embed');
    const cloudAdapter = shouldUseCloud ? createCloudStorageAdapter(projectId) : undefined;

    return new AppModeStrategy({
      cloudAdapter,
      isEmbedded: embedded,
    });
  }, [isAuthenticated, storageMode, projectId]);

  return {
    strategy,
    isWidget: strategy.mode === 'widget',
    isApp: strategy.mode === 'app',
  };
}
