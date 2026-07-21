# Portfolio

Next.js portfolio with an admin studio (Prisma + JWT auth).

## Local setup

```bash
npm install
npm run db:setup
npm run dev
```

Copy `.env.example` to `.env` and set `JWT_SECRET` / admin credentials.

## Deploy checklist

### Blocker: SQLite on Vercel

Prisma is configured with **SQLite** (`provider = "sqlite"`, typically `DATABASE_URL=file:./dev.db`).

That is fine for local development. On **Vercel serverless** the filesystem is ephemeral and not shared across invocations, so SQLite will **not** work as a production database.

Before production deploy, switch to a durable database (e.g. **Turso/libSQL**, **Postgres** / Neon / Supabase) and update `prisma/schema.prisma` + `DATABASE_URL` accordingly. Then run migrations / `db push` against that database and seed admin if needed.

### Required environment variables

- `DATABASE_URL` — Prisma connection string (durable DB in production)
- `JWT_SECRET` — Signing secret for admin session tokens
- `ADMIN_EMAIL` — Admin login email (seed / reset script)
- `ADMIN_PASSWORD` — Admin login password (seed / reset script)

Do not commit real `.env` values. Use the host secret store (e.g. Vercel Project Settings).

### Build commands

- **Install:** `npm install` (runs `postinstall` → `prisma generate`)
- **Build:** `prisma generate && next build` (`npm run build`)
- **Start** (Node host): `npm run start`

On Vercel, Next.js preset is enough when these scripts are present.

### After first deploy

1. Point `DATABASE_URL` at the production DB
2. Apply schema: `npx prisma db push` (or migrate) with production env
3. Seed / reset admin: `npm run db:seed` or `npm run admin:reset` with production env
4. Confirm `/studio` login works

## Scripts

- `npm run db:generate` — Prisma client
- `npm run db:push` — push schema
- `npm run db:seed` — seed content + admin
- `npm run admin:reset` — reset admin password from env
