# Quickstart: Projects CRUD API

**Feature**: 014-projects-crud-api  
**Date**: 2026-01-22

## Prerequisites

1. Server package running: `cd packages/thingsvis-server && pnpm dev`
2. Database migrated: `pnpm db:push` (or `db:migrate`)
3. User account created and logged in (session cookie required)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects` | List projects (paginated) |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/:id` | Get project details |
| PUT | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |

## Quick Examples

### List Projects

```bash
curl -X GET 'http://localhost:3001/api/v1/projects?page=1&limit=10' \
  -H 'Cookie: next-auth.session-token=<token>'
```

Response:
```json
{
  "data": [
    {
      "id": "clx123...",
      "name": "My Project",
      "description": "A dashboard project",
      "createdAt": "2026-01-22T10:00:00.000Z",
      "updatedAt": "2026-01-22T10:00:00.000Z",
      "createdBy": { "id": "...", "name": "John", "email": "john@example.com" },
      "_count": { "dashboards": 3 }
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

### Create Project

```bash
curl -X POST 'http://localhost:3001/api/v1/projects' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=<token>' \
  -d '{"name": "New Project", "description": "Optional description"}'
```

Response (201):
```json
{
  "id": "clx456...",
  "name": "New Project",
  "description": "Optional description",
  "tenantId": "...",
  "createdById": "...",
  "createdAt": "2026-01-22T10:00:00.000Z",
  "updatedAt": "2026-01-22T10:00:00.000Z"
}
```

### Get Project Details

```bash
curl -X GET 'http://localhost:3001/api/v1/projects/clx456...' \
  -H 'Cookie: next-auth.session-token=<token>'
```

Response includes dashboards:
```json
{
  "id": "clx456...",
  "name": "New Project",
  "dashboards": [
    { "id": "...", "name": "Dashboard 1", "isPublished": false }
  ]
}
```

### Update Project

```bash
curl -X PUT 'http://localhost:3001/api/v1/projects/clx456...' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=<token>' \
  -d '{"name": "Updated Name"}'
```

### Delete Project

```bash
curl -X DELETE 'http://localhost:3001/api/v1/projects/clx456...' \
  -H 'Cookie: next-auth.session-token=<token>'
```

Response:
```json
{ "success": true }
```

## Error Responses

### 400 Validation Error
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": { "name": ["Required"] },
    "formErrors": []
  }
}
```

### 401 Unauthorized
```json
{ "error": "Unauthorized" }
```

### 404 Not Found
```json
{ "error": "Project not found" }
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/validators/project.ts` | Zod schemas for validation |
| `src/lib/auth-helpers.ts` | Session helper function |
| `src/app/api/v1/projects/route.ts` | List & Create endpoints |
| `src/app/api/v1/projects/[id]/route.ts` | Get, Update, Delete endpoints |

## Testing Checklist

- [ ] List returns only projects from user's tenant
- [ ] Create sets correct tenantId and createdById
- [ ] Get returns 404 for other tenant's projects
- [ ] Update refreshes updatedAt timestamp
- [ ] Delete cascades to dashboards
- [ ] Validation rejects empty name
- [ ] Pagination works correctly
