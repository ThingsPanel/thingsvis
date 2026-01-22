# Quickstart: Prisma Schema Setup

**Feature**: 013-prisma-schema  
**Date**: January 22, 2026

## Prerequisites

- Node.js 20 LTS installed
- pnpm installed globally
- `packages/thingsvis-server` package exists (from P0-1 setup)

## Setup Steps

### 1. Navigate to Server Package

```bash
cd packages/thingsvis-server
```

### 2. Ensure Environment File Exists

Create `.env` if it doesn't exist:

```bash
# packages/thingsvis-server/.env
DATABASE_URL="file:./dev.db"
```

### 3. Install Dependencies (if not already done)

```bash
pnpm install
```

### 4. Generate Prisma Client

```bash
pnpm db:generate
```

**Expected Output**: Prisma Client generated successfully

### 5. Push Schema to Database

```bash
pnpm db:push
```

**Expected Output**:
- SQLite database file created at `prisma/dev.db`
- All tables created (tenants, users, projects, dashboards, dashboard_versions)

### 6. Verify with Prisma Studio

```bash
pnpm db:studio
```

**Expected Result**: Browser opens with Prisma Studio showing all 5 tables

## Verification Checklist

| Step | Command | Expected Result |
|------|---------|-----------------|
| Generate client | `pnpm db:generate` | No errors, client generated |
| Push schema | `pnpm db:push` | Database created, tables created |
| Open studio | `pnpm db:studio` | Browser opens with data browser |
| View tables | (in Studio UI) | 5 tables visible: tenants, users, projects, dashboards, dashboard_versions |
| Check relationships | (in Studio UI) | FK relationships visible |

## Common Issues

### Issue: "DATABASE_URL not found"

**Solution**: Create `.env` file with `DATABASE_URL="file:./dev.db"`

### Issue: "Error parsing schema"

**Solution**: Check for syntax errors in `prisma/schema.prisma`. Run `npx prisma format` to auto-fix formatting.

### Issue: "Cannot find module '@prisma/client'"

**Solution**: Run `pnpm db:generate` to generate the Prisma Client

### Issue: "Foreign key constraint failed"

**Solution**: Ensure referenced records exist before creating related records. Insert Tenant before User, Project before Dashboard, etc.

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma Client from schema |
| `pnpm db:push` | Push schema changes to database (no migration history) |
| `pnpm db:migrate` | Create migration and apply (production-ready) |
| `pnpm db:studio` | Open Prisma Studio data browser |

## Next Steps

After schema is verified:
1. **P0-3**: Configure NextAuth.js authentication
2. **P0-4**: Implement user registration API
3. **P0-5**: Implement Projects CRUD API
4. **P0-6**: Implement Dashboards CRUD API
