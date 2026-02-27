# 实现计划 (Implementation Plan)

## 移除不必要的黄色调试框
1. 定位目标文件 `f:\coding\thingsvis\apps\studio\src\components\tools\LineConnectionTool.tsx`。
2. 找到第 508 行至 511 行间包含的内容：
   ```tsx
   {/* Debug indicator */}
   <div style={{ position: 'fixed', top: 10, left: 10, background: 'yellow', padding: 5, zIndex: 9999 }}>
     Line selected: {selectedLineId?.slice(0,8)}
   </div>
   ```
3. 将这块针对开发环境暴露的 Debug 标识完全切除。

## 验证与测试
- 打开编辑画板，加入一条连线组件。
- 鼠标点击选中连线。左上角不应当再有黄底提示块漂浮弹出。
