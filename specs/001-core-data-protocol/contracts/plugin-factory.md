# Contract: IWidgetFactory Interface

**Feature**: Core Data Protocol and Kernel Interfaces  
**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Interface Definition

```typescript
interface IWidgetFactory {
  /**
   * Creates a new component instance of the specified type.
   * 
   * @param type - Component type identifier (e.g., 'echarts-bar', 'custom-widget')
   * @returns A new component instance implementing IVisualComponent
   * @throws Error if component type is not supported or creation fails
   */
  create(type: string): IVisualComponent;
}
```

## Contract Requirements

### Method Contracts

#### `create(type: string): IVisualComponent`

**Preconditions**:
- `type` is a non-empty string
- Factory supports the requested component type
- Factory has necessary resources to create component

**Postconditions**:
- Returns a new `IVisualComponent` instance
- Returned instance is ready for `mount()` call
- Returned instance is independent (not shared with other calls)

**Error Conditions**:
- `type` is empty or invalid → Throw `TypeError` or `Error` with message "Invalid component type"
- Component type not supported → Throw `Error` with message "Component type '{type}' not supported"
- Creation fails (e.g., missing dependencies) → Throw `Error` with message describing failure

**Side Effects**:
- May load/initialize plugin resources
- Creates new component instance
- May register component with internal registry

## Type Safety Requirements

- ✅ No `any` types in interface definition
- ✅ Return type is explicitly `IVisualComponent` (not inferred)
- ✅ Parameter type is `string` (not `any`)

## Factory Registration

**Note**: Factory registration mechanism is out of scope for this feature. Factories will be registered with the kernel through a separate mechanism.

**Assumed Registration Pattern** (for reference only):
```typescript
// Future kernel API (not part of this contract)
kernel.registerFactory('echarts-bar', myFactory);
const component = kernel.createComponent('echarts-bar');
```

## Implementation Notes

### Component Type Mapping

Factories should maintain a mapping of component type strings to component constructors:

```typescript
class MyPluginFactory implements IWidgetFactory {
  private componentMap = new Map<string, () => IVisualComponent>([
    ['echarts-bar', () => new EchartsBarComponent()],
    ['custom-widget', () => new CustomWidgetComponent()],
  ]);

  create(type: string): IVisualComponent {
    const factory = this.componentMap.get(type);
    if (!factory) {
      throw new Error(`Component type '${type}' not supported`);
    }
    return factory();
  }
}
```

### Error Handling

Implementations should:
- Validate `type` parameter (non-empty string)
- Provide clear error messages for unsupported types
- Handle creation failures gracefully
- Not return `null` or `undefined` (throw error instead)

### Instance Independence

Each call to `create()` must return a new, independent instance:

```typescript
const factory = new MyPluginFactory();
const component1 = factory.create('echarts-bar');
const component2 = factory.create('echarts-bar');
// component1 !== component2 (different instances)
```

## Testing Requirements

Contract tests should verify:
1. ✅ `create()` returns `IVisualComponent` instance for supported types
2. ✅ `create()` throws for unsupported component types
3. ✅ `create()` throws for empty/invalid type string
4. ✅ Each `create()` call returns a new instance (not shared)
5. ✅ Returned instances implement `IVisualComponent` contract
6. ✅ No `any` types in implementation

## Relationship to IVisualComponent

The `IWidgetFactory` contract depends on the `IVisualComponent` contract:
- Factory must return instances that conform to `IVisualComponent`
- Factory errors should not affect component lifecycle contracts
- Component instances created by factory follow `IVisualComponent` lifecycle

## Extension Points

Future extensions may add:
- `createWithProps(type: string, props: Record<string, unknown>): IVisualComponent`
- `supports(type: string): boolean` - Check if type is supported
- `getSupportedTypes(): string[]` - List supported component types

These are not part of the current contract but may be added in future features.

