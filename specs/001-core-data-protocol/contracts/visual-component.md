# Contract: IVisualComponent Interface

**Feature**: Core Data Protocol and Kernel Interfaces  
**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Interface Definition

```typescript
interface IVisualComponent {
  /**
   * Mounts the component to the provided DOM element.
   * Called once when the component is first added to the page.
   * 
   * @param el - The HTML element to mount the component to
   * @param props - Component properties from schema (Record<string, unknown>)
   * @throws Error if element is invalid or component cannot be mounted
   */
  mount(el: HTMLElement, props: Record<string, unknown>): void;

  /**
   * Updates the component with new properties.
   * Called whenever component props change.
   * 
   * @param props - Updated component properties (Record<string, unknown>)
   * @throws Error if component is not mounted or update fails
   */
  update(props: Record<string, unknown>): void;

  /**
   * Resizes the component to new dimensions.
   * Called when container/viewport size changes.
   * 
   * @param width - New width in pixels
   * @param height - New height in pixels
   * @throws Error if component is not mounted or resize fails
   */
  resize(width: number, height: number): void;

  /**
   * Unmounts the component and cleans up resources.
   * Called when component is removed from the page.
   * Safe to call multiple times (idempotent).
   */
  unmount(): void;
}
```

## Contract Requirements

### Method Contracts

#### `mount(el: HTMLElement, props: Record<string, unknown>): void`

**Preconditions**:
- Component is not already mounted
- `el` is a valid, attached HTMLElement
- `props` conforms to component's expected property structure

**Postconditions**:
- Component is attached to `el`
- Component is initialized and ready to render
- Component state reflects `props` values

**Error Conditions**:
- `el` is null or undefined → Throw `TypeError`
- `el` is not attached to DOM → Throw `Error` with message "Element must be attached to DOM"
- Component already mounted → Throw `Error` with message "Component already mounted"
- Invalid props structure → Throw `Error` with message describing validation failure

**Side Effects**:
- Creates DOM nodes, event listeners, or other resources
- Initializes component state
- May trigger initial render

#### `update(props: Record<string, unknown>): void`

**Preconditions**:
- Component is mounted (mount() was called successfully)
- `props` conforms to component's expected property structure

**Postconditions**:
- Component state reflects new `props` values
- Component re-renders if necessary

**Error Conditions**:
- Component not mounted → Throw `Error` with message "Component not mounted. Call mount() first"
- Invalid props structure → Throw `Error` with message describing validation failure

**Side Effects**:
- Updates component state
- May trigger re-render
- May update DOM nodes

#### `resize(width: number, height: number): void`

**Preconditions**:
- Component is mounted
- `width` and `height` are positive numbers (>= 1)

**Postconditions**:
- Component dimensions match `width` and `height`
- Component layout adjusts if necessary

**Error Conditions**:
- Component not mounted → Throw `Error` with message "Component not mounted. Call mount() first"
- Invalid dimensions (non-number, negative, zero) → Throw `TypeError` or `RangeError`

**Side Effects**:
- Updates component dimensions
- May trigger layout recalculation
- May trigger re-render

#### `unmount(): void`

**Preconditions**:
- None (idempotent - safe to call multiple times)

**Postconditions**:
- Component is detached from DOM
- All resources are cleaned up
- Component is in unmounted state

**Error Conditions**:
- None (must not throw errors, even if already unmounted)

**Side Effects**:
- Removes DOM nodes
- Removes event listeners
- Frees memory/resources
- Component cannot be used until mount() is called again

## Lifecycle Order

Components must follow this lifecycle order:

1. **Construction** → Component instance created (via factory)
2. **Mount** → `mount()` called once
3. **Update/Resize** → `update()` and/or `resize()` called zero or more times
4. **Unmount** → `unmount()` called once

**Invalid Sequences**:
- ❌ `update()` or `resize()` called before `mount()`
- ❌ `mount()` called after `unmount()` without new instance
- ❌ `mount()` called multiple times on same instance

## Type Safety Requirements

- ✅ No `any` types in interface definition
- ✅ `props` parameter uses `Record<string, unknown>` (not `any`)
- ✅ Element parameter uses `HTMLElement` (not `any` or `unknown`)
- ✅ Return types are explicitly `void` (not inferred)

## Implementation Notes

### Props Type Narrowing

Implementations should narrow `Record<string, unknown>` to specific prop types:

```typescript
class MyComponent implements IVisualComponent {
  mount(el: HTMLElement, props: Record<string, unknown>): void {
    // Narrow props to specific type
    const myProps = props as MyComponentProps;
    // Use myProps with type safety
  }
}
```

### Element Type Narrowing

Implementations can narrow `HTMLElement` to specific element types:

```typescript
mount(el: HTMLElement, props: Record<string, unknown>): void {
  if (el instanceof HTMLCanvasElement) {
    // Use canvas-specific APIs
  }
}
```

### Error Handling

Implementations should:
- Validate inputs before processing
- Provide clear error messages
- Clean up partial state on errors
- Not throw errors from `unmount()` (idempotent)

## Testing Requirements

Contract tests should verify:
1. ✅ `mount()` succeeds with valid inputs
2. ✅ `mount()` throws with invalid element
3. ✅ `update()` throws if called before `mount()`
4. ✅ `resize()` throws if called before `mount()`
5. ✅ `unmount()` is idempotent (safe to call multiple times)
6. ✅ Lifecycle order is enforced
7. ✅ No `any` types in implementation

