# Changelog

## v1.0.3 - 2026-03-19

### Added
- Introduced runtime context and save-plan infrastructure for better state coordination and persistence flow.
- Added RuntimeContextProvider integration across Studio runtime composition.
- Added new custom widgets and related Studio/documentation integration in the recent release range.

### Changed
- Redesigned the Value Card widget with trend support, prefix support, icon configuration, and a new card layout.
- Switched Value Card icon rendering to real Lucide icons instead of text-only badge placeholders.
- Updated Value Card default numeric value to `0`.
- Improved color customization behavior for button, input, progress, select, slider, and date range picker widgets.
- Refactored BaseStylePanel and widget control filtering to enforce exclusive ownership of base style properties.
- Refactored runtime services to remove singleton-style coupling and improve runtime-scoped service usage.

### Fixed
- Corrected the default `value` property handling in Value Card props schema.
- Fixed embedded platform history bindings.
- Fixed widget contract and runtime locale standardization issues.
- Improved widget module path handling in runtime contract tests.

### Notes
- This release tag is created from the current `master` HEAD.
