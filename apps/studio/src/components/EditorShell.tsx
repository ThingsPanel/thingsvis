/**
 * EditorShell — Strategy-Driven Editor Entry Point
 *
 * Phase 1.4: 轻量入口，自动选择 EditorStrategy 并传递给现有 Editor。
 *
 * 当前实现策略:
 * - 不重写 Editor.tsx 的 UI (2199 行)
 * - 通过 StrategyContext 向 Editor 注入策略实例
 * - Editor.tsx 逐步改写为使用 context 中的策略替代内联逻辑
 * - 最终 Editor.tsx 可以缩减为纯 UI 外壳
 *
 * 这样做的好处:
 * 1. 不一次性重写，降低风险
 * 2. 可以渐进式迁移
 * 3. 旧 Editor 保持可用
 */

import React, { createContext, useContext, useEffect, useRef } from 'react'
import type { EditorStrategy } from '../strategies/EditorStrategy'
import { useEditorStrategy } from '../hooks/useEditorStrategy'
import Editor from './Editor'
import { useParams } from 'react-router-dom'

// ─── Strategy Context ───

export const EditorStrategyContext = createContext<EditorStrategy | null>(null)

/** 供 Editor.tsx 内部使用的 hook */
export function useStrategy(): EditorStrategy | null {
    return useContext(EditorStrategyContext)
}

// ─── EditorShell Component ───

export default function EditorShell() {
    const { dashboardId } = useParams<{ dashboardId: string }>()
    const { strategy, isWidget, isApp } = useEditorStrategy(dashboardId)
    const listenerCleanup = useRef<(() => void) | null>(null)

    // Setup strategy listeners
    useEffect(() => {
        if (strategy.setupListeners) {
            listenerCleanup.current = strategy.setupListeners()
        }
        return () => {
            listenerCleanup.current?.()
            listenerCleanup.current = null
        }
    }, [strategy])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            strategy.dispose()
        }
    }, [strategy])

    console.log(
        `[EditorShell] Rendering with ${isWidget ? 'Widget' : 'App'} strategy`
    )

    return (
        <EditorStrategyContext.Provider value={strategy}>
            <Editor />
        </EditorStrategyContext.Provider>
    )
}
