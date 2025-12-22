# Quickstart: Studio–Kernel Integration

This guide covers how to set up and run the integrated Studio and Kernel.

## Prerequisites
- Node.js 18+
- pnpm 8+

## Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build packages (Kernel & UI):
   ```bash
   pnpm --filter "@thingsvis/kernel" build
   # and
   pnpm --filter "@thingsvis-ui" build
   ```

3. Start the Studio app:
   ```bash
   pnpm --filter "studio" dev
   ```

## Key Integration Points

### 1. Mounting the Canvas
In `apps/studio/src/components/Editor.tsx`:
```tsx
import { createKernelStore } from '@thingsvis/kernel';
import { CanvasView } from '@thingsvis/ui';

const store = createKernelStore();

// Render
<CanvasView store={store} activeTool="select" />
```

### 2. Adding a Plugin Node
```tsx
store.getState().addNodes([{
  id: 'my-node',
  type: 'custom/cyber-clock',
  position: { x: 100, y: 100 },
  size: { width: 200, height: 200 },
  props: {}
}]);
```

### 3. Creating a Connection
```tsx
store.getState().addConnection({
  sourceNodeId: 'node-1',
  targetNodeId: 'node-2',
  props: { stroke: '#ff0000' }
});
```

### 4. Handling Undo/Redo
```tsx
const handleUndo = () => store.temporal.getState().undo();
const handleRedo = () => store.temporal.getState().redo();
```


## Running Tests
```bash
# Unit tests
pnpm test

# E2E tests for DnD and Undo
pnpm --filter "studio" test:e2e
```

