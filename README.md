# Portfolio

Next.js portfolio with an admin studio (Prisma + JWT auth).

## Local setup

```bash
npm install
cp .env.example .env
# Edit .env: set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:setup
npm run dev
```

Studio: http://localhost:3000/studio

## Why production login fails

The UI message **"Login failed"** (English) means the login API returned **500/503** — usually the database is unreachable (typical when `DATABASE_URL=file:./dev.db` is deployed to **Vercel**). Local `file:` SQLite is ephemeral / missing on serverless.

Wrong email/password shows **"Неверный email или пароль"** (401), not "Login failed".

`ADMIN_EMAIL` / `ADMIN_PASSWORD` are **not** checked on every login. They are used to:

1. Seed / `npm run admin:reset`, and
2. **One-time bootstrap**: if the `Admin` table has **zero** rows and you sign in with exactly those env values, the first admin is created automatically.

Login always verifies bcrypt against the `Admin` row in the database.

## Deploy checklist

### Required environment variables (host dashboard — do not upload `.env` as a file on Vercel)

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | **Yes** (prod) | Long random string. Missing → 503 misconfigured. |
| `ADMIN_EMAIL` | Recommended | Seed + first-login bootstrap |
| `ADMIN_PASSWORD` | Recommended | Seed + first-login bootstrap |
| `DATABASE_URL` | Local / VPS | `file:./dev.db` only on hosts with a **persistent disk** |
| `TURSO_DATABASE_URL` | Vercel | `libsql://...` from Turso |
| `TURSO_AUTH_TOKEN` | Vercel | Turso auth token |

Uploading a `.env` file into a Git deploy does **not** reliably set secrets on Vercel. Use **Project Settings → Environment Variables**.

### Vercel without Turso (temporary)

`npm run build` creates `prisma/deploy.db` (schema + seed). On Vercel, if Turso is not set, the app copies that file to `/tmp` so Studio login and content work.

**Caveat:** `/tmp` is per-instance and ephemeral — studio edits can disappear on cold starts. For durable CMS data, configure Turso (Option A).

Required Vercel env even for the temporary path:

- `JWT_SECRET`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (first login bootstraps admin if the Admin table is empty after seed)

### Option A — Vercel + Turso (recommended)

1. Create a free DB at [turso.tech](https://turso.tech) and copy URL + token.
2. In Vercel env:
   - `TURSO_DATABASE_URL=libsql://...`
   - `TURSO_AUTH_TOKEN=...`
   - `JWT_SECRET=<long random>`
   - `ADMIN_EMAIL=you@example.com`
   - `ADMIN_PASSWORD=<strong password>`
3. Apply schema to Turso (from your machine, with Turso CLI):

```bash
# After: turso auth login && turso db shell <your-db-name>
turso db shell <your-db-name> < prisma/migrations/20260721134448_init/migration.sql
```

Or push via local Prisma against a file DB, then apply the same SQL to Turso.

4. Redeploy. Sign in at `/studio` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` once (bootstrap creates the admin if the table is empty), **or** seed from your machine:

```bash
# PowerShell example — use your real Turso values
$env:TURSO_DATABASE_URL="libsql://..."
$env:TURSO_AUTH_TOKEN="..."
$env:ADMIN_EMAIL="you@example.com"
$env:ADMIN_PASSWORD="your-password"
npm run admin:reset
```

### Option B — VPS / Railway / Node host with persistent disk

1. Set `DATABASE_URL=file:./data/prod.db` (path on a persistent volume).
2. Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. On the server after deploy:

```bash
npx prisma db push
npm run db:seed
# or: npm run admin:reset
```

4. Open `/studio` and sign in.

### Build commands

- **Install:** `npm install` (`postinstall` → `prisma generate`)
- **Build:** `prisma generate && next build` (`npm run build`)
- **Start** (Node host): `npm run start`

### Cookies

In production (`NODE_ENV=production`) the session cookie is `httpOnly`, `secure`, `sameSite=lax`. HTTPS is required.

## Scripts

- `npm run db:generate` — Prisma client
- `npm run db:push` — push schema (local SQLite URL)
- `npm run db:seed` — seed content + admin
- `npm run admin:reset` — upsert admin password from env
