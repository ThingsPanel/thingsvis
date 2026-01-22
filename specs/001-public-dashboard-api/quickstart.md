# Quickstart: Public Dashboard Access API

**Feature**: 001-public-dashboard-api  
**Date**: January 22, 2026

## Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL database running
- `@thingsvis/server` package with existing dashboard CRUD

## Setup

### 1. Install Dependencies

```bash
cd packages/thingsvis-server
pnpm add nanoid
```

### 2. Verify Database Schema

The Dashboard model already has sharing fields. Verify with:

```bash
pnpm db:studio
```

Check that Dashboard table has:
- `isPublished` (Boolean)
- `publishedAt` (DateTime?)
- `shareToken` (String?, unique)
- `shareConfig` (String?)

## API Usage

### Publish a Dashboard

```bash
# Publish
curl -X POST http://localhost:3001/api/v1/dashboards/{id}/publish \
  -H "Authorization: Bearer {token}"

# Response
{
  "id": "clx1234567890abcdef",
  "isPublished": true,
  "publishedAt": "2026-01-22T10:30:00.000Z"
}
```

### Generate Share Link

```bash
# Basic share link
curl -X POST http://localhost:3001/api/v1/dashboards/{id}/share \
  -H "Authorization: Bearer {token}"

# With password and expiration
curl -X POST http://localhost:3001/api/v1/dashboards/{id}/share \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"password": "secret123", "expiresIn": 86400}'

# Response
{
  "shareToken": "share_V1StGXR8_Z5jdHi6B",
  "shareUrl": "/preview/share_V1StGXR8_Z5jdHi6B"
}
```

### Access Public Dashboard

```bash
# Without password
curl http://localhost:3001/api/v1/public/dashboard/share_V1StGXR8_Z5jdHi6B

# With password
curl http://localhost:3001/api/v1/public/dashboard/share_V1StGXR8_Z5jdHi6B \
  -H "X-Share-Password: secret123"

# Response
{
  "id": "clx1234567890abcdef",
  "name": "Sales Dashboard",
  "canvasConfig": { "mode": "fixed", "width": 1920, "height": 1080, "background": "#1a1a2e" },
  "nodes": [...],
  "dataSources": [...]
}
```

### Unpublish Dashboard

```bash
curl -X DELETE http://localhost:3001/api/v1/dashboards/{id}/publish \
  -H "Authorization: Bearer {token}"

# Response
{
  "id": "clx1234567890abcdef",
  "isPublished": false,
  "publishedAt": null
}
```

## File Structure

After implementation:

```
packages/thingsvis-server/src/app/api/v1/
├── dashboards/
│   └── [id]/
│       ├── route.ts           # Existing CRUD
│       ├── publish/
│       │   └── route.ts       # POST/DELETE for publish/unpublish
│       └── share/
│           └── route.ts       # POST/GET/DELETE for share links
└── public/
    └── dashboard/
        └── [token]/
            └── route.ts       # GET for public access
```

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Dashboard must be published before sharing |
| 401 | Unauthorized (auth) or password required (public) |
| 404 | Dashboard or share token not found |
| 410 | Share link expired |

## Testing Workflow

1. Create a dashboard via existing CRUD API
2. Publish the dashboard: `POST /dashboards/:id/publish`
3. Generate share link: `POST /dashboards/:id/share`
4. Access publicly: `GET /public/dashboard/:token`
5. Test with password protection and expiration
6. Unpublish and verify share link stops working

## Next Steps

After implementation:
1. Run `/speckit.tasks` to generate implementation task list
2. Implement routes in order: publish → share → public
3. Add validators to `lib/validators/share.ts`
4. Test all acceptance scenarios from spec
