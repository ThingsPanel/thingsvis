# Multi-type Data Source Integration - Technical Documentation

## Overview
The data source integration feature allows visual components to bind to various data protocols (REST, WebSocket, Static JSON) and transform the raw data using a secure JS sandbox.

## Architecture
The system is split into two layers:
1.  **Kernel Layer (`@thingsvis/kernel`)**: Handles the business logic, adapter lifecycle, and JS transformation.
2.  **UI Layer (`@thingsvis/ui`)**: Provides React hooks and HOCs for components to consume the data.

## Key Components

### 1. DataSourceManager (Kernel)
The central registry for all active data sources. It manages the lifecycle (connect/disconnect) of adapters.

### 2. Adapters (Kernel)
- `RESTAdapter`: Supports polling-based API fetching.
- `WSAdapter`: Supports real-time WebSocket streams.
- `StaticAdapter`: Handles static mock data for prototyping.

### 3. SafeExecutor (Kernel)
A secure JS execution environment using a `Proxy` based sandbox to prevent access to global objects like `window` or `document`.

### 4. ExpressionEvaluator (Utils)
Parses `{{ ... }}` expressions to bind component properties to data source paths.

## Usage for Developers

### Registering a Data Source
```typescript
import { dataSourceManager } from '@thingsvis/kernel';

dataSourceManager.registerDataSource({
  id: 'my-api',
  type: 'REST',
  config: { url: 'https://api.example.com/v1/data', pollingInterval: 5000 },
  transformation: 'return data.items[0]'
});
```

### Binding in Components
Visual components can use the `useDataSource` hook or bind via schema:
```json
{
  "type": "text",
  "props": {
    "content": "{{ ds.my-api.data.name }}"
  }
}
```

## Performance Performance (React Bypass)
For high-frequency data (e.g., real-time sensor streams), use `useRealtimeData` with `shouldReRender: false` and a callback to update the renderer (Leafer/Three.js) directly.

