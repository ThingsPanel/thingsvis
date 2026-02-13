# Editor Architecture Refactoring Design

## 1. Problem Statement
The current `Editor.tsx` is a monolithic component (2000+ lines) that attempts to handle two distinct and conflicting scenarios:
1.  **Widget Mode (Embedded Component)**:
    *   **Data Source**: Passed via `props` or `postMessage`.
    *   **Identity**: No real "Project ID" in the cloud sense; uses 'widget' or temporary IDs.
    *   **Persistence**: Auto-save disabled or handled by host callback.
    *   **UI**: Minimal (often hides toolbar/sidebar).
2.  **App Mode (Standalone/Iframe Application)**:
    *   **Data Source**: Fetched from Cloud API using `projectId` from URL.
    *   **Identity**: Strict `projectId` from URL path parameter.
    *   **Persistence**: Auto-save to Cloud API.
    *   **UI**: Full editor experience.

**Current Issues:**
*   **High Coupling**: Logic for both modes is intertwined in `useEffect` hooks and conditional statements.
*   **Fragility**: Fixing one mode (e.g., App ID loading) often breaks the other (Widget init).
*   **Maintainability**: The file is too large and hard to reason about.

## 2. Refactoring Goals (High Availability)
*   **Isolation**: Strictly separate the initialization and persistence logic for the two modes.
*   **Stability**: Ensure modifications to one mode do not regress the other.
*   **Scalability**: Make it easy to add new modes (e.g., "Template Mode" or "ReadOnly Mode") in the future.
*   **Clarity**: Reduce `Editor.tsx` size by extracting logic into composed strategies.

## 3. Architecture Design

We will apply the **Strategy Pattern** to handle the different initialization and persistence behaviors.

### 3.1 Core Abstraction: `EditorStrategy`

```typescript
interface EditorStrategy {
  /**
   * Determines if this strategy applies to the current context
   */
  canHandle(): boolean;

  /**
   * Resolves the initial project ID
   */
  getProjectId(): string | Promise<string>;

  /**
   * Loads the project data (Canvas, Nodes, etc.)
   */
  loadProject(id: string): Promise<ProjectData | null>;

  /**
   * Handles saving the project
   */
  saveProject(id: string, data: ProjectData): Promise<void>;
  
  /**
   * Returns the storage mode ('cloud' | 'local' | 'memory')
   */
  storageMode: 'cloud' | 'local' | 'memory';
}
```

### 3.2 Concrete Strategies

#### A. `AppModeStrategy` (Standalone)
*   **Detection**: URL has `/editor/:id` OR `mode=app` (default).
*   **ID Resolution**: 
    1.  Read `:dashboardId` from Route Params (using `useParams`).
    2.  Fallback to `localStorage` or new UUID.
*   **Loading**: Call `storage.get(id)` (Cloud/Local API).
*   **Saving**: Call `storage.save(id, data)` (Cloud/Local API).
*   **UI**: Show full UI.

#### B. `WidgetModeStrategy` (Embedded)
*   **Detection**: URL query `mode=embedded` OR `mode=widget`.
*   **ID Resolution**: 
    1.  'widget' (static).
    2.  Wait for `init` signal from Host.
*   **Loading**: 
    *   Do **NOT** call Cloud API.
    *   Initialize with empty/default state.
    *   Listen for `thingsvis:editor-init` message.
*   **Saving**: 
    *   Do **NOT** call Cloud API.
    *   Post `triggerSave` message to Host.
*   **UI**: Hide specific elements based on URL params (`showToolbar=0`, etc.).

### 3.3 New Component Structure

Refactor `Editor.tsx` to be a "dumb" container that delegates logic to a custom hook.

```tsx
// src/components/Editor/EditorContainer.tsx (New Entry)
export default function EditorContainer() {
  const strategy = useEditorStrategy(); // Detects and returns active strategy
  const { 
    isLoading, 
    projectData, 
    save, 
    uiConfig 
  } = useEditorController(strategy);

  if (isLoading) return <LoadingSpinner />;

  return (
    <EditorLayout 
      config={uiConfig}
      onSave={save}
      // ...
    />
  );
}
```

## 4. Implementation Plan

1.  **Create Strategy Interfaces**: Define the `EditorStrategy` contract in `src/lib/editor/strategies/types.ts`.
2.  **Implement Strategies**:
    *   `src/lib/editor/strategies/AppModeStrategy.ts`
    *   `src/lib/editor/strategies/WidgetModeStrategy.ts`
3.  **Implement Context/Hook**: 
    *   `src/hooks/useEditorStrategy.ts`: Factory to select strategy.
    *   `src/hooks/useEditorController.ts`: Manages state using the strategy.
4.  **Refactor `Editor.tsx`**:
    *   Rename current `Editor.tsx` to `EditorLegacy.tsx` (temporarily).
    *   Create new `Editor.tsx` that uses the new hooks.
    *   Move UI rendering to `EditorUI.tsx` (pure component).
5.  **Verify**:
    *   Test Widget Mode (ThingsPanel Device Template).
    *   Test App Mode (ThingsVis Visualization Menu).

## 5. Immediate Fix vs. Long-term Refactor

Given the current blockage (App Mode broken), we will implement a **Phase 1** fix that introduces the Strategy concept *inline* within `Editor.tsx` first, ensuring the ID resolution is fixed via `useParams`, while preparing the code for the full split.

**Phase 1 Actions:**
1.  Import `useParams` in `Editor.tsx`.
2.  Refactor `resolveInitialProjectId` to use a strategy-like checks (Route > Query > Storage).
3.  Add explicit "Mode Guard" in the Bootstrap `useEffect` to prevent Cross-Talk (e.g., Widget mode trying to load from Cloud).

This ensures immediate stability while paving the way for the full refactor.
