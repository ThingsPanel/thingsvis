# Quickstart: Configure NextAuth.js for Authentication

**Feature Branch**: `001-nextauth-config`  
**Date**: January 22, 2026

## Prerequisites

- Node.js 20 LTS
- pnpm installed
- thingsvis-server package initialized (from P0-1)
- Prisma schema with User/Tenant models (from P0-2)

## Setup Steps

### 1. Install Dependencies

```bash
cd packages/thingsvis-server
pnpm add next-auth@beta @auth/prisma-adapter bcryptjs
pnpm add -D @types/bcryptjs
```

### 2. Configure Environment Variables

Add to `packages/thingsvis-server/.env`:

```env
# Existing
DATABASE_URL="file:./dev.db"

# New - Auth
AUTH_SECRET="generate-a-random-32-character-string-here"
AUTH_URL="http://localhost:3001"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 3. Create Source Files

Create the following files in `packages/thingsvis-server/`:

1. **src/lib/db.ts** - Prisma client singleton
2. **src/lib/auth.ts** - NextAuth.js configuration
3. **src/app/api/auth/[...nextauth]/route.ts** - Auth API handler
4. **src/middleware.ts** - Route protection middleware
5. **src/types/next-auth.d.ts** - Type augmentation

### 4. Start Development Server

```bash
cd packages/thingsvis-server
pnpm dev
```

Server runs at http://localhost:3001

## Testing Authentication

### Create a Test User

Since registration API is not yet implemented (P0-4), create a user directly in the database:

```bash
cd packages/thingsvis-server
pnpm db:studio
```

In Prisma Studio:
1. Create a Tenant: `{ name: "Test Org", slug: "test-org" }`
2. Create a User with:
   - email: `test@example.com`
   - passwordHash: (generate with bcrypt, cost 12)
   - role: `OWNER`
   - tenantId: (from step 1)

To generate a password hash, use Node.js:
```javascript
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('password123', 12));
// Output: $2a$12$...
```

### Test Login

1. **Get CSRF Token**:
   ```bash
   curl http://localhost:3001/api/auth/csrf
   ```

2. **Sign In**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/callback/credentials \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

3. **Check Session**:
   ```bash
   curl http://localhost:3001/api/auth/session \
     --cookie "authjs.session-token=<token-from-signin>"
   ```

### Test Protected Routes

1. **Without Auth** (should return 401):
   ```bash
   curl http://localhost:3001/api/v1/projects
   # Response: {"error":"Unauthorized"}
   ```

2. **With Auth** (should succeed):
   ```bash
   curl http://localhost:3001/api/v1/projects \
     --cookie "authjs.session-token=<token>"
   ```

3. **Public Route** (no auth needed):
   ```bash
   curl http://localhost:3001/api/v1/health
   # Response: {"status":"ok"}
   ```

## Verification Checklist

- [ ] `pnpm dev` starts without errors
- [ ] `/api/auth/providers` returns credentials provider
- [ ] Login with valid credentials sets session cookie
- [ ] `/api/auth/session` returns user with id, email, role, tenantId
- [ ] Protected routes return 401 without auth
- [ ] Protected routes succeed with valid session
- [ ] `/api/v1/health` works without auth

## Common Issues

### "AUTH_SECRET is not defined"
Ensure `.env` contains `AUTH_SECRET` and restart the dev server.

### "Module not found: @/lib/auth"
Check `tsconfig.json` has `paths: { "@/*": ["./src/*"] }`.

### Session returns empty object
- Verify cookie is being sent with request
- Check browser dev tools for `authjs.session-token` cookie
- Ensure `AUTH_URL` matches the server URL

### 500 error on login
- Check Prisma client is generated: `pnpm db:generate`
- Verify User table exists: `pnpm db:push`
- Check server logs for detailed error

## Next Steps

After this feature is implemented:
1. **P0-4**: Implement user registration API
2. Add login UI page (separate task)
3. Add SSO providers for ThingsPanel integration
