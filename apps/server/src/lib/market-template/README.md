# Market Template Module

This module provides export/import functionality for ThingsPanel Market Solution Bundles, enabling dashboards to be shared as reusable templates.

## Overview

The Market Template system allows:
- **Export**: Convert a local dashboard into a template by replacing real device references with abstract `bindingKey` placeholders
- **Import**: Create a new dashboard from a template by binding it to local devices

## Key Concepts

### Device Bindings

Device bindings define placeholder references for devices:

```typescript
interface DeviceBinding {
  bindingKey: "room-sensor",        // Abstract key for template
  deviceTemplateKey: "temp-sensor", // Required device template
  displayName?: "温湿度传感器",      // Optional display name
  required: true,                    // Must be bound
  allowMany: false                   // Allow multiple devices
}
```

### Field Bindings

Field bindings define which data fields from a device template are used:

```typescript
interface FieldBinding {
  bindingKey: "room-sensor",  // References a device binding
  kind: "telemetry",          // telemetry | attribute | command | event
  identifier: "temperature",  // Field identifier from device template
  required: true
}
```

### Dashboard Template Snapshot

The complete template structure:

```typescript
interface DashboardTemplateSnapshot {
  resourceKey: "smart-home-dashboard",
  version: "1.0.0",
  name: "智能家居看板",
  schemaVersion: "thingsvis-1",
  canvasConfig: { /* canvas settings */ },
  nodes: [ /* widget nodes */ ],
  dataSources: [ /* data source configs */ ],
  variables: [ /* dashboard variables */ ],
  deviceBindings: [ /* binding definitions */ ],
  fieldBindings: [ /* field references */ ]
}
```

## API Endpoints

### Export Dashboard

```
GET /api/v1/dashboards/:id/export?exportMode=market-template
```

**Query Parameters:**
- `exportMode` (required): Must be `market-template`
- `deviceBindingHints` (optional): JSON array of binding hints

**Response:**
```json
{
  "success": true,
  "snapshot": { /* DashboardTemplateSnapshot */ },
  "warnings": ["Optional warnings"]
}
```

### Import Dashboard

```
POST /api/v1/dashboards/import
```

**Request Body:**
```json
{
  "snapshot": { /* DashboardTemplateSnapshot */ },
  "localDeviceBindings": [
    { "bindingKey": "room-sensor", "deviceId": "dev-123" }
  ],
  "name": "Optional custom name",
  "projectId": "Optional project ID"
}
```

**Response:**
```json
{
  "success": true,
  "dashboardId": "new-dashboard-id",
  "name": "Imported Dashboard"
}
```

## Security

### What's Stripped During Export

The export process sanitizes the dashboard to remove:
- Real device IDs (`deviceId`)
- Tenant IDs (`tenantId`)
- User IDs (`userId`)
- Share tokens (`shareToken`)
- API keys and secrets
- Passwords

### Template Device IDs

The system uses these reserved patterns:
- `__template__` - Generic template device placeholder
- `__device_platform_template__` - Platform field template
- `__platform___<bindingKey>__` - Binding-key-specific template

## File Structure

```
apps/server/src/lib/market-template/
├── index.ts                 # Public API exports
├── validators.ts           # Zod schemas and types
├── binding-extractor.ts     # Extract bindings from dashboard
├── security.ts             # Sanitization utilities
└── __tests__/
    ├── validators.test.ts
    ├── binding-extractor.test.ts
    └── security.test.ts

apps/server/src/app/api/v1/dashboards/
├── [id]/export/route.ts   # Export API
└── import/route.ts         # Import API
```

## Usage Example

### Exporting a Dashboard

```typescript
import { exportDashboardAsMarketTemplate } from '@/lib/api/dashboards';

// Export with binding hints
const response = await exportDashboardAsMarketTemplate('dashboard-id', {
  exportMode: 'market-template',
  deviceBindingHints: [
    { bindingKey: 'room-sensor', deviceTemplateKey: 'temperature-humidity-sensor' }
  ]
});

if (response.data.success) {
  console.log('Template snapshot:', response.data.snapshot);
}
```

### Importing a Template

```typescript
import { importMarketTemplate } from '@/lib/api/dashboards';

const response = await importMarketTemplate({
  snapshot: templateSnapshot,
  localDeviceBindings: [
    { bindingKey: 'room-sensor', deviceId: 'local-device-123' }
  ],
  name: 'My Living Room Dashboard'
});

if (response.data.success) {
  console.log('New dashboard:', response.data.dashboardId);
}
```

## Hydration in Studio

When loading a template-based dashboard in ThingsVis Studio, use the `hydrateDevicePresetSchema` function from `@/lib/devicePresetHydration`:

```typescript
import { hydrateDevicePresetSchema } from '@/lib/devicePresetHydration';

// Hydrate with the actual device ID
const hydrated = hydrateDevicePresetSchema(
  { nodes, dataSources, variables },
  'actual-device-id'
);
```

This replaces template placeholders with the bound device ID.

## Testing

Run tests with:

```bash
pnpm test -- apps/server/src/lib/market-template
```

## Related Documentation

- Contract schema: `contracts/market-solution-bundle/v1/manifest.schema.json`
- Golden fixture: `contracts/market-solution-bundle/v1/smart-home-basic.fixture.json`
- Task specification: `docs/task-bundles/market-solution-bundle-v1/03-thingsvis-dashboard-template.md`
