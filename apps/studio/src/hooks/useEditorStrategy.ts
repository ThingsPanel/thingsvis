/**
 * useEditorStrategy Hook
 *
 * Phase 1: 根据当前 URL / 运行环境自动选择 EditorStrategy 实例。
 *
 * 选择逻辑:
 * - URL 含 saveTarget=host 或 mode=embedded + Host 管理项目 → WidgetModeStrategy
 * - 其他 (嵌入 + saveTarget=self, 独立运行) → AppModeStrategy
 */

import { useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import type { EditorStrategy } from '../strategies/EditorStrategy'
import { AppModeStrategy } from '../strategies/AppModeStrategy'
import { WidgetModeStrategy } from '../strategies/WidgetModeStrategy'
import { createCloudStorageAdapter } from '../lib/storage/adapter'
import { isEmbedMode } from '../embed/embed-mode'

interface UseEditorStrategyResult {
    strategy: EditorStrategy
    isWidget: boolean
    isApp: boolean
}

export function useEditorStrategy(projectId?: string): UseEditorStrategyResult {
    const { isAuthenticated, storageMode } = useAuth()

    const strategy = useMemo<EditorStrategy>(() => {
        const embedded = isEmbedMode()

        // 解析 URL 参数
        const hash = window.location.hash || ''
        const queryIndex = hash.indexOf('?')
        let saveTarget = 'self'
        if (queryIndex >= 0) {
            const params = new URLSearchParams(hash.slice(queryIndex + 1))
            saveTarget = params.get('saveTarget') || 'self'
        }

        // Widget Mode: 嵌入 + saveTarget=host
        if (embedded && saveTarget === 'host') {
            console.log('[useEditorStrategy] → WidgetModeStrategy')
            return new WidgetModeStrategy()
        }

        // App Mode: 独立运行 或 嵌入 + saveTarget=self
        const shouldUseCloud = isAuthenticated && (storageMode === 'cloud' || storageMode === 'embed')
        const cloudAdapter = shouldUseCloud ? createCloudStorageAdapter(projectId) : undefined

        console.log('[useEditorStrategy] → AppModeStrategy (cloud:', !!cloudAdapter, ', embedded:', embedded, ')')
        return new AppModeStrategy({
            cloudAdapter,
            isEmbedded: embedded,
        })
    }, [isAuthenticated, storageMode, projectId])

    return {
        strategy,
        isWidget: strategy.mode === 'widget',
        isApp: strategy.mode === 'app',
    }
}
