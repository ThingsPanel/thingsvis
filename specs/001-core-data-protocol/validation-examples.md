# Validation Examples: Core Data Protocol

**Feature**: Core Data Protocol and Kernel Interfaces  
**Date**: 2025-01-27  
**Purpose**: Demonstrate schema validation with valid and invalid inputs

## Page Schema Validation Examples

### Valid Page Definition

```typescript
import { PageSchema } from '@thingsvis/schema';

const validPage = {
  meta: {
    id: '550e8400-e29b-41d4-a716-446655440000',
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

const result = PageSchema.safeParse(validPage);
if (result.success) {
  console.log('✅ Page is valid:', result.data);
} else {
  console.error('❌ Validation errors:', result.error.errors);
}
```

### Page with Default Values

```typescript
const pageWithDefaults = {
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

const result = PageSchema.parse(pageWithDefaults);
console.log(result.meta.version); // "1.0.0"
console.log(result.config.width);  // 1920
console.log(result.config.height); // 1080
```

### Invalid Page - Missing Required Fields

```typescript
const invalidPage = {
  meta: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    // Missing: version, name, scope
  },
  config: {
    mode: 'fixed',
    theme: 'dark'
    // Missing: width, height
  }
  // Missing: content
};

const result = PageSchema.safeParse(invalidPage);
if (!result.success) {
  console.error('❌ Validation failed:', result.error.errors);
  // Expected errors:
  // - meta.version: Required
  // - meta.name: Required
  // - meta.scope: Required
  // - config.width: Required
  // - config.height: Required
  // - content: Required
}
```

### Invalid Page - Invalid Enum Values

```typescript
const invalidEnums = {
  meta: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    version: '1.0.0',
    name: 'My Page',
    scope: 'invalid-scope' // ❌ Invalid enum value
  },
  config: {
    mode: 'invalid-mode', // ❌ Invalid enum value
    width: 1920,
    height: 1080,
    theme: 'invalid-theme' // ❌ Invalid enum value
  },
  content: {
    nodes: []
  }
};

const result = PageSchema.safeParse(invalidEnums);
if (!result.success) {
  console.error('❌ Validation failed:', result.error.errors);
  // Expected errors:
  // - meta.scope: Invalid enum value. Expected 'app' | 'template'
  // - config.mode: Invalid enum value. Expected 'fixed' | 'infinite' | 'reflow'
  // - config.theme: Invalid enum value. Expected 'dark' | 'light' | 'auto'
}
```

### Invalid Page - Invalid UUID Format

```typescript
const invalidUUID = {
  meta: {
    id: 'not-a-uuid', // ❌ Invalid UUID format
    version: '1.0.0',
    name: 'My Page',
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

const result = PageSchema.safeParse(invalidUUID);
if (!result.success) {
  console.error('❌ Validation failed:', result.error.errors);
  // Expected error:
  // - meta.id: Invalid uuid
}
```

## Component Schema Validation Examples

### Valid Component Definition

```typescript
import { VisualComponentSchema } from '@thingsvis/schema';

const validComponent = {
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

const result = VisualComponentSchema.safeParse(validComponent);
if (result.success) {
  console.log('✅ Component is valid:', result.data);
} else {
  console.error('❌ Validation errors:', result.error.errors);
}
```

### Component with Default Values

```typescript
const componentWithDefaults = {
  identity: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    type: 'echarts-bar',
    name: 'Sales Chart',
    // locked omitted - will default to false
    // hidden omitted - will default to false
  },
  transform: {
    x: 100,
    y: 200,
    width: 800,
    height: 400,
    // rotation omitted - will default to 0
  },
  data: {
    sourceId: 'data-source-1',
    topic: 'sales-data',
    transform: ''
  },
  // props omitted - will default to {}
  // events omitted - will default to []
};

const result = VisualComponentSchema.parse(componentWithDefaults);
console.log(result.identity.locked); // false
console.log(result.identity.hidden); // false
console.log(result.transform.rotation); // 0
console.log(result.props); // {}
console.log(result.events); // []
```

### Invalid Component - Missing Required Fields

```typescript
const invalidComponent = {
  identity: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    // Missing: type, name
  },
  transform: {
    x: 100,
    // Missing: y, width, height
  },
  data: {
    // Missing: sourceId, topic, transform
  }
  // Missing: props, events
};

const result = VisualComponentSchema.safeParse(invalidComponent);
if (!result.success) {
  console.error('❌ Validation failed:', result.error.errors);
  // Expected errors for missing required fields
}
```

### Invalid Component - Invalid Types

```typescript
const invalidTypes = {
  identity: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    type: 'echarts-bar',
    name: 'Sales Chart',
    locked: 'not-a-boolean', // ❌ Invalid type
    hidden: false
  },
  transform: {
    x: '100', // ❌ Invalid type (string instead of number)
    y: 200,
    width: 800,
    height: 400,
    rotation: 0
  },
  data: {
    sourceId: 'data-source-1',
    topic: 'sales-data',
    transform: 123 // ❌ Invalid type (number instead of string)
  },
  props: {},
  events: []
};

const result = VisualComponentSchema.safeParse(invalidTypes);
if (!result.success) {
  console.error('❌ Validation failed:', result.error.errors);
  // Expected errors:
  // - identity.locked: Expected boolean, received string
  // - transform.x: Expected number, received string
  // - data.transform: Expected string, received number
}
```

## Type Inference Verification

### TypeScript Type Safety

```typescript
import { type IPage, type IVisualComponent } from '@thingsvis/schema';

// TypeScript will catch type errors at compile time
const page: IPage = {
  meta: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    version: '1.0.0',
    name: 'My Page',
    scope: 'app' // ✅ TypeScript knows only 'app' | 'template' allowed
  },
  config: {
    mode: 'fixed', // ✅ TypeScript knows only 'fixed' | 'infinite' | 'reflow' allowed
    width: 1920,
    height: 1080,
    theme: 'dark' // ✅ TypeScript knows only 'dark' | 'light' | 'auto' allowed
  },
  content: {
    nodes: []
  }
};

// ❌ TypeScript error: Type '"invalid"' is not assignable to type '"app" | "template"'
const invalidPage: IPage = {
  meta: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    version: '1.0.0',
    name: 'My Page',
    scope: 'invalid' // ❌ Compile-time error
  },
  // ...
};
```

## Summary

- ✅ Valid definitions pass validation
- ✅ Default values are applied automatically
- ✅ Missing required fields are caught
- ✅ Invalid enum values are rejected
- ✅ Invalid types are rejected
- ✅ Invalid UUID format is rejected
- ✅ TypeScript types provide compile-time safety

