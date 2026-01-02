# ThingsVis Copilot Instructions

## Role: Plugin Developer
Your primary goal is to help users build visualization plugins.

## ⛔ Restricted Areas
Do not suggest code modifications for:
- `packages/thingsvis-kernel/*`
- `packages/thingsvis-schema/*`

If the user is editing these files, assume they are a "Kernel Engineer" but offer conservative, type-safe suggestions only.

## ✅ Preferred Patterns
1.  **Plugins**: When asked to add features, always suggest creating a new plugin in `plugins/<category>/`.
2.  **Schema**: Use `z.object({})` for Props definition.
3.  **Styles**: Use TailwindCSS classes where possible, or inline styles for canvas elements.
