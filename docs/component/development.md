# Component Development Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-31

This guide details how to develop custom components (plugins) for ThingsVis using the `createOverlay` API.

## 📋 Table of Contents

- [Component Structure](#component-structure)
- [Plugin Entry (`index.ts`)](#plugin-entry-indexts)
- [Metadata (`metadata.ts`)](#metadata-metadatats)
- [Property Schema (`schema.ts`)](#property-schema-schemats)
- [Editor Controls (`controls.ts`)](#editor-controls-controlsts)
- [Lifecycle Methods](#lifecycle-methods)

---

## Component Structure

A standard component plugin resides in `plugins/<category>/<name>` and contains:

```
my-component/
├── src/
│   ├── index.ts        # Main entry point
│   ├── metadata.ts     # Component metadata
│   ├── schema.ts       # Props definition (Zod)
│   ├── controls.ts     # Editor controls config
│   └── lib/            # Utilities
├── package.json
└── tsconfig.json
```

---

## Plugin Entry (`index.ts`)

The entry file exports the main plugin module.

```typescript
import { metadata } from './metadata';
import { PropsSchema } from './schema';
import { controls } from './controls';

// Create the overlay instance
function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  
  // Apply props...
  
  return {
    element,
    // Called when properties change
    update: (newCtx) => {
        // Update DOM based on new props
    },
    // Called when component is removed
    destroy: () => {
        // Cleanup event listeners, etc.
    }
  };
}

// Export the module
export const Main: PluginMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  createOverlay, // Use createOverlay for DOM-based components
};
```

---

## Metadata (`metadata.ts`)

Defines how the component appears in the system.

```typescript
export const metadata = {
  id: 'category-component-name', // Unique ID
  name: 'My Component',          // Display Name
  category: 'basic',             // Category
  icon: 'Box',                   // Icon name from Lucide
  version: '1.0.0',
  resizable: true,               // Allow manual resizing?
} as const;
```

---

## Property Schema (`schema.ts`)

Defines the properties your component accepts, using Zod.

```typescript
import { z } from 'zod';

export const PropsSchema = z.object({
  text: z.string().default('Hello'),
  color: z.string().default('#000000'),
  fontSize: z.number().default(14),
});

export type Props = z.infer<typeof PropsSchema>;
```

---

## Editor Controls (`controls.ts`)

Defines how your properties appear in the property panel and how data binding behaves.

```typescript
import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  // 1. Group properties
  groups: {
    Content: ['text'],
    Style: ['fill', 'fontSize'],
    Advanced: ['padding'],
  },
  
  // 2. Override control types
  overrides: {
    fill: { kind: 'color' }, // Render a color picker
  },
  
  // 3. Configure Data Binding (Superset-style)
  bindings: {
    text: { 
      enabled: true, 
      modes: ['static', 'field', 'expr'] 
      // static: Manual input
      // field: Select field from Data Source (No expressions!)
      // expr: {{ ... }} fallback
    },
    fill: { enabled: true, modes: ['static', 'field'] },
  },
});
```

### Binding Modes
-   **Static**: User inputs a fixed value.
-   **Field**: User picks a Data Source + Field. **Zero code**.
-   **Expression**: Advanced users use `{{ ... }}` syntax.

---

## Lifecycle Methods

### `createOverlay(ctx)`
Initialize your component here. Create DOM elements, attach initial styles, and return the instance object.

### `update(ctx)`
Called whenever the component's properties or data binding values change.
-   **Performance Tip**: Only update the parts of the DOM that actually changed.

### `destroy()`
Cleanup resources like timers, global event listeners, or third-party library instances to prevent memory leaks.

---

## Tips

-   **Styling**: Use standard CSS/inline styles.
-   **Responsiveness**: Use `width: 100%; height: 100%` on your root element to fill the allocated space on the canvas.
-   **Interactivity**: Standard DOM events (`click`, `mouseenter`) work as expected.
