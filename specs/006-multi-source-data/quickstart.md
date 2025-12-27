# Quickstart: 多类型数据源集成 (Multi-type Data Source Integration)

**Feature**: 006-multi-source-data

## Developer Onboarding

### 1. Register a New Data Source
In the Kernel layer, use the `DataSourceManager` to add a source.

```typescript
import { dataSourceManager } from '@thingsvis/kernel';

dataSourceManager.register({
  id: 'weather-api',
  name: 'OpenWeather Map',
  type: 'REST',
  config: {
    url: 'https://api.openweathermap.org/data/2.5/weather',
    method: 'GET',
    params: { q: 'Shanghai' }
  },
  transformation: 'return data.main.temp - 273.15;' // Kelvin to Celsius
});
```

### 2. Bind to a Component
In the UI layer, use the `useDataSource` hook or expression syntax in schema.

**Via React Hook:**
```tsx
import { useDataSource } from '@thingsvis/ui';

const TempDisplay = () => {
  const { data, isLoading } = useDataSource('weather-api');
  if (isLoading) return <span>Loading...</span>;
  return <h1>Current Temp: {data}°C</h1>;
};
```

**Via Schema Binding (Expression):**
```json
{
  "type": "text",
  "props": {
    "content": "{{ ds.weather-api.data }} °C",
    "fill": "red"
  }
}
```

### 3. Handle Real-time Streams
MQTT sources update automatically.

```typescript
dataSourceManager.register({
  id: 'iot-sensor',
  type: 'MQTT',
  config: {
    broker: 'wss://broker.emqx.io:8084/mqtt',
    topic: 'sensors/living-room/temp'
  }
});
```

## Running Tests

```bash
# Unit tests
pnpm test packages/thingsvis-kernel/src/datasources

# Integration tests
pnpm test packages/thingsvis-ui/src/hooks/useDataSource.spec.ts
```

