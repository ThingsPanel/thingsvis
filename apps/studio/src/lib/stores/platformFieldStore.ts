/**
 * Platform Field Store
 * 
 * 存储宿主端传入的平台字段（遥测/属性），供 FieldPicker 等 UI 组件订阅。
 * 支持通过 PostMessage 动态更新，解决 URL 长度限制问题。
 */

import { create } from 'zustand'

export interface PlatformField {
    id: string
    name: string
    type: 'number' | 'string' | 'boolean' | 'json'
    dataType: 'telemetry' | 'attribute' | 'command'
    unit?: string
    description?: string
}

interface PlatformFieldState {
    /** 平台字段列表 */
    fields: PlatformField[]
    /** 设置/替换全部字段 */
    setFields: (fields: PlatformField[]) => void
    /** 清空字段 */
    clearFields: () => void
}

export const usePlatformFieldStore = create<PlatformFieldState>((set) => ({
    fields: [],
    setFields: (fields) => set({ fields }),
    clearFields: () => set({ fields: [] }),
}))

/**
 * 非 React 环境下获取/设置字段的辅助方法
 */
export const platformFieldStore = {
    getFields: () => usePlatformFieldStore.getState().fields,
    setFields: (fields: PlatformField[]) => usePlatformFieldStore.getState().setFields(fields),
    clearFields: () => usePlatformFieldStore.getState().clearFields(),
}
