# Quickstart: Core Data Protocol and Kernel Interfaces

**Feature**: Core Data Protocol and Kernel Interfaces  
**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Overview

This guide demonstrates how to use the Core Data Protocol schemas and Kernel Interfaces in ThingsVis. The schemas provide runtime validation and type safety, while the kernel interfaces define contracts for component lifecycle management.

## Installation

Schemas and interfaces are available in the ThingsVis monorepo packages:

```bash
# Install dependencies (from repo root)
pnpm install

# Build packages
pnpm build
```

## Using Schemas

### Creating a Page Definition

```typescript
import { PageSchema, type IPage } from '@thingsvis/schema';

// Create a page definition
const pageData: IPage = {
  meta: {
    id: '550e8400-e29b-41d4-a716-446655440000', // UUID v4
    version: '1.0.0',
    name: 'Dashboard Page',
    scope: 'app'
  },
  config: {
    mode: 'fixed',
    width: 1920,
    height: 1080,
    theme: 'dark'
  },
  content: {
    nodes: []
  }
};

// Validate the page
const result = PageSchema.safeParse(pageData);
if (result.success) {
  console.log('Page is valid:', result.data);
} else {
  console.error('Validation errors:', result.error.errors);
}
```

### Creating a Component Definition

```typescript
import { VisualComponentSchema, type IVisualComponent } from '@thingsvis/schema';

// Create a component definition
const componentData: IVisualComponent = {
  identity: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    type: 'echarts-bar',
    name: 'Sales Chart',
    locked: false,
    hidden: false
  },
  transform: {
    x: 100,
    y: 200,
    width: 800,
    height: 400,
    rotation: 0
  },
  data: {
    sourceId: 'data-source-1',
    topic: 'sales-data',
    transform: 'return data.map(d => ({ value: d.amount }));'
  },
  props: {
    color: '#3498db',
    showLegend: true
  },
  events: [
    {
      trigger: 'click',
      action: 'navigate',
      payload: { url: '/details' }
    }
  ]
};

// Validate the component
const result = VisualComponentSchema.safeParse(componentData);
if (result.success) {
  console.log('Component is valid:', result.data);
} else {
  console.error('Validation errors:', result.error.errors);
}
```

### Using Default Values

```typescript
import { PageSchema } from '@thingsvis/schema';

// Version defaults to "1.0.0" if not provided
const pageData = {
  meta: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    // version omitted - will default to "1.0.0"
    name: 'My Page',
    scope: 'app'
  },
  config: {
    mode: 'fixed',
    // width and height omitted - will default to 1920x1080
    theme: 'dark'
  },
  content: {
    nodes: []
  }
};

const result = PageSchema.parse(pageData);
console.log(result.meta.version); // "1.0.0"
console.log(result.config.width);  // 1920
console.log(result.config.height); // 1080
```

### Type Inference

TypeScript types are automatically inferred from schemas:

```typescript
import { PageSchema, type IPage } from '@thingsvis/schema';

// Type is inferred automatically
const page: IPage = {
  // TypeScript will autocomplete and validate fields
  meta: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    version: '1.0.0',
    name: 'My Page',
    scope: 'app' // TypeScript knows only 'app' | 'template' allowed
  },
  // ...
};

// Type checking at compile time
const invalidPage: IPage = {
  meta: {
    id: 'not-a-uuid', // ❌ TypeScript error: not a valid UUID
    scope: 'invalid'   // ❌ TypeScript error: not 'app' | 'template'
  }
  // ...
};
```

## Using Kernel Interfaces

### Implementing IVisualComponent

```typescript
import { IVisualComponent } from '@thingsvis/kernel';
import type { IVisualComponent as ComponentData } from '@thingsvis/schema';

class MyChartComponent implements IVisualComponent {
  private element: HTMLElement | null = null;
  private props: Record<string, unknown> = {};

  mount(el: HTMLElement, props: Record<string, unknown>): void {
    if (this.element) {
      throw new Error('Component already mounted');
    }
    if (!el.isConnected) {
      throw new Error('Element must be attached to DOM');
    }

    this.element = el;
    this.props = props;
    
    // Initialize component
    this.initialize();
  }

  update(props: Record<string, unknown>): void {
    if (!this.element) {
      throw new Error('Component not mounted. Call mount() first');
    }

    this.props = props;
    this.render();
  }

  resize(width: number, height: number): void {
    if (!this.element) {
      throw new Error('Component not mounted. Call mount() first');
    }

    // Update dimensions
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.render();
  }

  unmount(): void {
    if (this.element) {
      // Cleanup
      this.element.innerHTML = '';
      this.element = null;
      this.props = {};
    }
  }

  private initialize(): void {
    // Component-specific initialization
  }

  private render(): void {
    // Component-specific rendering
  }
}
```

### Implementing IWidgetFactory

```typescript
import { IWidgetFactory, IVisualComponent } from '@thingsvis/kernel';
import { MyChartComponent } from './my-chart-component';

class MyPluginFactory implements IWidgetFactory {
  private componentMap = new Map<string, () => IVisualComponent>([
    ['echarts-bar', () => new MyChartComponent()],
    ['custom-widget', () => new CustomWidgetComponent()],
  ]);

  create(type: string): IVisualComponent {
    if (!type || typeof type !== 'string') {
      throw new TypeError('Component type must be a non-empty string');
    }

    const factory = this.componentMap.get(type);
    if (!factory) {
      throw new Error(`Component type '${type}' not supported`);
    }

    try {
      return factory();
    } catch (error) {
      throw new Error(`Failed to create component '${type}': ${error}`);
    }
  }
}

// Usage
const factory = new MyPluginFactory();
const component = factory.create('echarts-bar');
component.mount(document.getElementById('chart-container')!, { color: 'blue' });
```

### Type-Safe Props Handling

```typescript
import { IVisualComponent } from '@thingsvis/kernel';

// Define component-specific props type
interface ChartProps {
  color: string;
  showLegend: boolean;
  data: number[];
}

class ChartComponent implements IVisualComponent {
  mount(el: HTMLElement, props: Record<string, unknown>): void {
    // Narrow props to specific type
    const chartProps = this.validateProps(props);
    
    // Now use with type safety
    this.renderChart(chartProps.color, chartProps.showLegend, chartProps.data);
  }

  private validateProps(props: Record<string, unknown>): ChartProps {
    // Validate and narrow props
    if (
      typeof props.color === 'string' &&
      typeof props.showLegend === 'boolean' &&
      Array.isArray(props.data)
    ) {
      return props as ChartProps;
    }
    throw new Error('Invalid props structure');
  }

  private renderChart(color: string, showLegend: boolean, data: number[]): void {
    // Type-safe rendering
  }
}
```

## Integration Example

Complete example combining schemas and interfaces:

```typescript
import { PageSchema, VisualComponentSchema } from '@thingsvis/schema';
import { IWidgetFactory, IVisualComponent } from '@thingsvis/kernel';

// 1. Validate page schema
const pageData = { /* ... */ };
const pageResult = PageSchema.safeParse(pageData);
if (!pageResult.success) {
  throw new Error('Invalid page schema');
}

const page = pageResult.data;

// 2. Create components from page definition
const factory: IWidgetFactory = /* ... */;

for (const componentData of page.content.nodes) {
  // Validate component schema
  const componentResult = VisualComponentSchema.safeParse(componentData);
  if (!componentResult.success) {
    console.error('Invalid component:', componentResult.error);
    continue;
  }

  // Create component instance
  const component = factory.create(componentData.identity.type);
  
  // Mount component
  const container = document.getElementById(`component-${componentData.identity.id}`);
  if (container) {
    component.mount(container, componentData.props);
  }
}
```

## Error Handling

### Schema Validation Errors

```typescript
import { PageSchema } from '@thingsvis/schema';

const invalidPage = {
  meta: {
    id: 'not-a-uuid', // Invalid UUID
    scope: 'invalid'  // Invalid enum value
  }
};

const result = PageSchema.safeParse(invalidPage);
if (!result.success) {
  result.error.errors.forEach(error => {
    console.error(`Field: ${error.path.join('.')}, Error: ${error.message}`);
  });
}
```

### Interface Contract Errors

```typescript
try {
  component.update({}); // Called before mount()
} catch (error) {
  if (error instanceof Error) {
    console.error('Component error:', error.message);
  }
}
```

## Best Practices

1. **Always validate schemas** before using data:
   ```typescript
   const result = PageSchema.safeParse(data);
   if (!result.success) {
     // Handle validation errors
   }
   ```

2. **Use type inference** for compile-time safety:
   ```typescript
   import type { IPage } from '@thingsvis/schema';
   const page: IPage = { /* ... */ };
   ```

3. **Follow lifecycle order** for components:
   ```typescript
   component.mount(el, props);  // First
   component.update(newProps);   // Then updates
   component.resize(w, h);       // Or resizes
   component.unmount();          // Finally cleanup
   ```

4. **Handle errors gracefully**:
   ```typescript
   try {
     const component = factory.create(type);
   } catch (error) {
     // Log and handle gracefully
   }
   ```

5. **Narrow types** when working with `Record<string, unknown>`:
   ```typescript
   const props = componentData.props as MyComponentProps;
   ```

## Next Steps

- See [data-model.md](./data-model.md) for detailed entity definitions
- See [contracts/visual-component.md](./contracts/visual-component.md) for interface details
- See [contracts/plugin-factory.md](./contracts/plugin-factory.md) for factory contract
- Implement your own components using the kernel interfaces
- Create page definitions using the schema validation

