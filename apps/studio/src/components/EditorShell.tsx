/**
 * EditorShell — Strategy-Driven Editor Entry Point
 *
 * Phase 1.7: 充当 Editor.tsx 的策略协调层。
 *
 * 职责:
 * 1. 根据 URL / 环境选择 EditorStrategy (Widget / App)
 * 2. 通过 props 将策略配置 (UI 可见性、isWidgetMode) 传递给 Editor
 * 3. 通过 ref 获取 Editor 的 getProjectState，实现策略保存
 * 4. 管理 Widget Mode 的 triggerSave / request-save 监听
 *
 * Editor.tsx 只负责 UI 和画布逻辑，不再关心自己处于哪种模式。
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import type { EditorStrategy } from '../strategies/EditorStrategy'
import { useEditorStrategy } from '../hooks/useEditorStrategy'
import Editor from './Editor'
import type { EditorHandle } from './Editor'
import { useParams } from 'react-router-dom'
import { on as onEmbedEvent } from '../embed/embed-mode'
import { messageRouter, MSG_TYPES } from '../embed/message-router'

// ─── Strategy Context ───

export const EditorStrategyContext = createContext<EditorStrategy | null>(null)

/** 供 Editor.tsx 内部使用的 hook */
export function useStrategy(): EditorStrategy | null {
    return useContext(EditorStrategyContext)
}

// ─── EditorShell Component ───

export default function EditorShell() {
    const { dashboardId } = useParams<{ dashboardId: string }>()
    const { strategy, isWidget } = useEditorStrategy(dashboardId)
    const editorRef = useRef<EditorHandle>(null)

    // ─── Widget Mode: 监听 triggerSave 事件 ───
    // 当 SDK 的 triggerSave 触发时，从 Editor 获取状态并通过策略保存
    useEffect(() => {
        if (!isWidget) return

        const unsubscribe = onEmbedEvent('triggerSave', () => {
            if (!editorRef.current) {
                console.warn('[EditorShell] triggerSave: Editor ref not ready')
                return
            }
            console.log('[EditorShell] triggerSave: 通过策略保存')
            const state = editorRef.current.getProjectState()
            strategy.save(state)
        })

        return unsubscribe
    }, [isWidget, strategy])

    // ─── Widget Mode: 监听 Host 主动请求保存 (request-save) ───
    useEffect(() => {
        if (!isWidget) return

        const unsubscribe = messageRouter.on(MSG_TYPES.REQUEST_SAVE, () => {
            if (!editorRef.current) {
                console.warn('[EditorShell] request-save: Editor ref not ready')
                return
            }
            console.log('[EditorShell] 收到 Host request-save，通过策略保存')
            const state = editorRef.current.getProjectState()

            // request-save 使用 wrapped 格式 (与 Host SDK 的 on('thingsvis:save-config') 兼容)
            const payload = {
                config: {
                    meta: state.meta,
                    canvas: state.canvas,
                    nodes: state.nodes,
                    dataSources: state.dataSources,
                }
            }
            messageRouter.send(MSG_TYPES.HOST_SAVE, payload)
            console.log('[EditorShell] 已发送 host-save (request-save 路径)')
        })

        return unsubscribe
    }, [isWidget])

    // ─── Strategy Listeners (updateSchema, updateData 等) ───
    useEffect(() => {
        if (strategy.setupListeners) {
            const cleanup = strategy.setupListeners()
            return cleanup
        }
    }, [strategy])

    // ─── Cleanup on unmount ───
    useEffect(() => {
        return () => {
            strategy.dispose()
        }
    }, [strategy])

    // ─── 策略保存回调 (供 Editor 内部按钮调用) ───
    const handleStrategySave = useCallback(() => {
        if (!editorRef.current) return
        const state = editorRef.current.getProjectState()
        strategy.save(state)
    }, [strategy])

    // ─── 获取策略的 UI 可见性配置 ───
    const visibility = strategy.getUIVisibility()

    console.log(
        `[EditorShell] Rendering with ${isWidget ? 'Widget' : 'App'} strategy`
    )

    return (
        <EditorStrategyContext.Provider value={strategy}>
            <Editor
                ref={editorRef}
                embedVisibility={isWidget ? visibility : undefined}
                isWidgetMode={isWidget}
                onStrategySave={handleStrategySave}
            />
        </EditorStrategyContext.Provider>
    )
}
