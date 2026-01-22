# Quickstart: Dashboards CRUD API

**Feature**: 015-dashboards-crud-api  
**Date**: 2026-01-22

## Prerequisites

- ThingsVis server running (`pnpm dev` in `packages/thingsvis-server`)
- Valid session (logged in via NextAuth)
- At least one project created

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboards` | List dashboards |
| POST | `/api/v1/dashboards` | Create dashboard |
| GET | `/api/v1/dashboards/:id` | Get dashboard |
| PUT | `/api/v1/dashboards/:id` | Update dashboard |
| DELETE | `/api/v1/dashboards/:id` | Delete dashboard |

## Usage Examples

### List Dashboards

```bash
# List all dashboards in tenant
curl -X GET http://localhost:3000/api/v1/dashboards \
  -H "Cookie: authjs.session-token=YOUR_SESSION"

# Filter by project
curl -X GET "http://localhost:3000/api/v1/dashboards?projectId=clxxxxx" \
  -H "Cookie: authjs.session-token=YOUR_SESSION"

# With pagination
curl -X GET "http://localhost:3000/api/v1/dashboards?page=2&limit=10" \
  -H "Cookie: authjs.session-token=YOUR_SESSION"
```

**Response**:
```json
{
  "data": [
    {
      "id": "clxxxxx",
      "name": "Sales Dashboard",
      "version": 3,
      "isPublished": false,
      "projectId": "clyyyyy",
      "createdAt": "2026-01-22T10:00:00.000Z",
      "updatedAt": "2026-01-22T12:30:00.000Z",
      "project": { "id": "clyyyyy", "name": "Analytics" },
      "createdBy": { "id": "clzzzzz", "name": "John Doe" }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Create Dashboard

```bash
# Minimal (uses default canvas config)
curl -X POST http://localhost:3000/api/v1/dashboards \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION" \
  -d '{
    "name": "My Dashboard",
    "projectId": "clyyyyy"
  }'

# With custom canvas config
curl -X POST http://localhost:3000/api/v1/dashboards \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION" \
  -d '{
    "name": "4K Dashboard",
    "projectId": "clyyyyy",
    "canvasConfig": {
      "mode": "fixed",
      "width": 3840,
      "height": 2160,
      "background": "#0a0a1a"
    }
  }'
```

**Response** (201 Created):
```json
{
  "id": "clxxxxx",
  "name": "My Dashboard",
  "version": 1,
  "canvasConfig": {
    "mode": "fixed",
    "width": 1920,
    "height": 1080,
    "background": "#1a1a2e"
  },
  "nodes": [],
  "dataSources": [],
  "isPublished": false,
  "publishedAt": null,
  "shareToken": null,
  "shareConfig": null,
  "projectId": "clyyyyy",
  "createdById": "clzzzzz",
  "createdAt": "2026-01-22T10:00:00.000Z",
  "updatedAt": "2026-01-22T10:00:00.000Z"
}
```

### Get Dashboard

```bash
curl -X GET http://localhost:3000/api/v1/dashboards/clxxxxx \
  -H "Cookie: authjs.session-token=YOUR_SESSION"
```

**Response**:
```json
{
  "id": "clxxxxx",
  "name": "Sales Dashboard",
  "version": 3,
  "canvasConfig": {
    "mode": "fixed",
    "width": 1920,
    "height": 1080,
    "background": "#1a1a2e"
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "chart",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 400, "height": 300 },
      "props": { "chartType": "line" }
    }
  ],
  "dataSources": [
    {
      "id": "ds-1",
      "name": "Sales API",
      "type": "rest",
      "config": { "url": "https://api.example.com/sales" }
    }
  ],
  "isPublished": false,
  "project": { "id": "clyyyyy", "name": "Analytics" },
  "createdBy": { "id": "clzzzzz", "name": "John Doe" },
  "createdAt": "2026-01-22T10:00:00.000Z",
  "updatedAt": "2026-01-22T12:30:00.000Z"
}
```

### Update Dashboard

```bash
# Update canvas config
curl -X PUT http://localhost:3000/api/v1/dashboards/clxxxxx \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION" \
  -d '{
    "canvasConfig": {
      "mode": "fixed",
      "width": 2560,
      "height": 1440,
      "background": "#1e1e2e"
    }
  }'

# Update nodes (auto-save from editor)
curl -X PUT http://localhost:3000/api/v1/dashboards/clxxxxx \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION" \
  -d '{
    "nodes": [
      {
        "id": "node-1",
        "type": "chart",
        "position": { "x": 150, "y": 150 },
        "size": { "width": 500, "height": 400 },
        "props": { "chartType": "bar" }
      }
    ]
  }'

# Update multiple fields
curl -X PUT http://localhost:3000/api/v1/dashboards/clxxxxx \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION" \
  -d '{
    "name": "Updated Dashboard",
    "nodes": [...],
    "dataSources": [...]
  }'
```

**Note**: Each update automatically creates a version history entry before applying changes. The `version` field increments with each update.

### Delete Dashboard

```bash
curl -X DELETE http://localhost:3000/api/v1/dashboards/clxxxxx \
  -H "Cookie: authjs.session-token=YOUR_SESSION"
```

**Response**:
```json
{
  "success": true
}
```

## Error Responses

### 400 Bad Request (Validation)

```json
{
  "error": "Validation failed",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "name": ["String must contain at least 1 character(s)"],
      "projectId": ["Invalid cuid"]
    }
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "error": "Dashboard not found"
}
```

## Integration with Studio Editor

The dashboard editor should:

1. **Load dashboard**: `GET /api/v1/dashboards/:id` on editor mount
2. **Auto-save**: `PUT /api/v1/dashboards/:id` with debounced updates (e.g., 2 seconds after last change)
3. **Save button**: Immediate `PUT` call on user action
4. **JSON fields**: Use parsed objects directly (API returns objects, not strings)

```typescript
// Example: Load and save in React
async function loadDashboard(id: string) {
  const res = await fetch(`/api/v1/dashboards/${id}`)
  const dashboard = await res.json()
  // dashboard.canvasConfig is already an object
  // dashboard.nodes is already an array
  return dashboard
}

async function saveDashboard(id: string, updates: Partial<Dashboard>) {
  const res = await fetch(`/api/v1/dashboards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  return res.json()
}
```
