---
description: Development testing workflow - local dev server access and credentials
---

# Dev Test Workflow

## Local Dev Server
- **URL**: http://localhost:3000/main#/editor
- **Dev command**: `pnpm run dev:all` (from project root)

## Default Test Account
- **Email**: `admin@thingsvis.io`
- **Password**: `admin123`
- ⚠️ Test account only, change password in production.

## Browser Testing Steps
// turbo-all
1. Open http://localhost:3000/main#/editor in browser
2. Login with test credentials if prompted
3. Verify editor loads with canvas and sidebar
