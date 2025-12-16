# Research: Core Data Protocol and Kernel Interfaces

**Feature**: Core Data Protocol and Kernel Interfaces  
**Date**: 2025-01-27  
**Phase**: 0 - Research & Design Decisions

## Research Questions & Decisions

### 1. Zod Schema Patterns for Nested Structures

**Question**: How should we structure nested schemas (Page with Meta/Config/Content, Component with Identity/Transform/Data/Props/Events)?

**Decision**: Use Zod's `.extend()` and `.merge()` for composition, or define sub-schemas separately and combine with `.object()` containing nested objects. Prefer separate sub-schemas for better maintainability and reusability.

**Rationale**: 
- Separate schemas allow reuse (e.g., ComponentTransformSchema could be reused elsewhere)
- Better error messages when validation fails at specific nested levels
- Easier to test individual schema parts
- Follows Zod best practices for complex structures

**Alternatives Considered**:
- Single flat schema: Rejected - too complex, poor maintainability
- Deep nesting without sub-schemas: Rejected - harder to validate and test

**Implementation Pattern**:
```typescript
const SubSchema = z.object({ ... });
const MainSchema = z.object({
  sub: SubSchema,
  // other fields
});
```

### 2. UUID Validation in Zod

**Question**: How should we validate UUID v4 format in Zod schemas?

**Decision**: Use Zod's built-in `.uuid()` validator for UUID format validation. This provides standard UUID validation without requiring external libraries.

**Rationale**:
- Zod's `.uuid()` validates standard UUID format (8-4-4-4-12 hex format)
- No additional dependencies required
- Clear error messages when validation fails
- Works for UUID v4 (and other versions)

**Alternatives Considered**:
- Custom regex validation: Rejected - more error-prone, less maintainable
- External UUID library: Rejected - unnecessary dependency for format validation only

**Implementation Pattern**:
```typescript
id: z.string().uuid()
```

### 3. Enum Definitions in Zod

**Question**: How should we define enums (scope, mode, theme) in Zod schemas?

**Decision**: Use Zod's `.enum()` with TypeScript `as const` arrays or string literal unions. Prefer `.enum()` for better runtime validation and type inference.

**Rationale**:
- `.enum()` provides runtime validation (catches typos)
- TypeScript infers literal union types automatically
- Clear error messages for invalid enum values
- Type-safe at compile-time and runtime

**Alternatives Considered**:
- TypeScript enums: Rejected - don't provide runtime validation
- String unions without Zod: Rejected - no runtime validation

**Implementation Pattern**:
```typescript
scope: z.enum(['app', 'template'])
// TypeScript infers: 'app' | 'template'
```

### 4. Default Values in Zod Schemas

**Question**: How should we handle default values (version: "1.0.0", width: 1920, height: 1080)?

**Decision**: Use Zod's `.default()` method for optional fields with defaults. This ensures defaults are applied during validation/parsing.

**Rationale**:
- Defaults are applied automatically during `.parse()` or `.safeParse()`
- Type inference includes default values in type
- Consistent behavior across the codebase
- Can be overridden when needed

**Alternatives Considered**:
- Manual default application: Rejected - error-prone, inconsistent
- Required fields with manual defaults: Rejected - defeats purpose of schema validation

**Implementation Pattern**:
```typescript
version: z.string().default('1.0.0'),
width: z.number().default(1920)
```

### 5. Flexible Props with Type Safety

**Question**: How should we handle component props (Record<string, any>) while maintaining type safety?

**Decision**: Use `Record<string, unknown>` instead of `Record<string, any>` in TypeScript types, and `z.record(z.unknown())` in Zod schema. This maintains flexibility while avoiding `any` types.

**Rationale**:
- `unknown` requires type checking before use (safer than `any`)
- Still allows flexible key-value pairs
- Meets requirement of "no any in core interfaces"
- Component-specific props can be narrowed by component type

**Alternatives Considered**:
- `Record<string, any>`: Rejected - violates strict type safety requirement
- Strictly typed props per component: Rejected - too restrictive, props vary by component type
- `z.any()`: Rejected - violates requirement

**Implementation Pattern**:
```typescript
// In schema
props: z.record(z.unknown()).default({})

// Inferred type
props: Record<string, unknown>
```

### 6. Type Inference and Export Patterns

**Question**: How should we export types inferred from Zod schemas?

**Decision**: Use `z.infer<typeof Schema>` to generate TypeScript types automatically. Export both the schema and the inferred type. Use `IPage`, `IVisualComponent` naming convention for consistency with kernel interfaces.

**Rationale**:
- Single source of truth (schema defines both runtime validation and types)
- Type changes automatically when schema changes
- No manual type maintenance
- Consistent with existing codebase pattern (`Page` type already uses this)

**Alternatives Considered**:
- Manual type definitions: Rejected - duplicate maintenance, error-prone
- Separate type files: Rejected - unnecessary complexity

**Implementation Pattern**:
```typescript
export const PageSchema = z.object({ ... });
export type IPage = z.infer<typeof PageSchema>;
```

### 7. Kernel Interface Design (No `any` Types)

**Question**: How should we design kernel interfaces without using `any` types?

**Decision**: 
- Use `unknown` for truly flexible parameters, require type narrowing by implementers
- Use specific types from `@thingsvis/schema` where possible
- Use generic type parameters for type-safe method signatures
- Document type contracts clearly

**Rationale**:
- `unknown` forces type checking (safer than `any`)
- Using schema types ensures consistency between schema and interfaces
- Generics provide type safety while maintaining flexibility
- Meets strict type safety requirement

**Alternatives Considered**:
- Using `any`: Rejected - violates requirement
- Overly specific types: Rejected - too restrictive for plugin system

**Implementation Pattern**:
```typescript
interface IVisualComponent {
  mount(el: HTMLElement, props: Record<string, unknown>): void;
  update(props: Record<string, unknown>): void;
  resize(width: number, height: number): void;
  unmount(): void;
}
```

### 8. Element Type for Mount Method

**Question**: What type should the `mount` method accept for the element parameter?

**Decision**: Use `HTMLElement` as the base type. Components can narrow this based on their specific needs (e.g., `HTMLCanvasElement`, `SVGElement`).

**Rationale**:
- `HTMLElement` is the standard DOM element type
- Flexible enough for different rendering targets
- Type-safe (not `any` or `unknown`)
- Components can use type guards or assertions for specific element types

**Alternatives Considered**:
- `unknown`: Rejected - too permissive, loses type safety
- `Element`: Rejected - too generic, doesn't cover all HTML elements
- Generic type parameter: Considered but rejected - adds complexity without clear benefit

**Implementation Pattern**:
```typescript
mount(el: HTMLElement, props: Record<string, unknown>): void;
```

## Summary

All research questions resolved. Key decisions:
1. ✅ Nested schemas as separate sub-schemas combined in main schema
2. ✅ Zod `.uuid()` for UUID validation
3. ✅ Zod `.enum()` for enum definitions
4. ✅ Zod `.default()` for default values
5. ✅ `Record<string, unknown>` for flexible props (not `any`)
6. ✅ `z.infer<typeof Schema>` for automatic type inference
7. ✅ Strict interfaces with `unknown` and schema types (no `any`)
8. ✅ `HTMLElement` for mount method element parameter

All decisions align with constitution requirements and TypeScript strict mode.

