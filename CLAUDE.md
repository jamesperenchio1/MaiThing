# MaiThing (RescueBite) — Agent Working Instructions

This file is read automatically by Claude Code and should be read first by any AI coding agent (Claude, Kimi, etc.) joining this project. It contains project context, credentials, build state, and operating rules.

## Project Summary

**MaiThing** is the brand name. The internal codename is **RescueBite**. Full build spec: `RESCUEBITE-BUILD-BRIEF.md`. This is a Thailand surplus-food marketplace — a Too Good To Go clone targeting all food businesses in Thailand.

**Stack**: pnpm monorepo + turborepo · Supabase Cloud backend · Expo (consumer app) · Next.js (admin) · Stripe Connect · i18n TH/EN

## Active Development Branch

```
claude/rescuebite-thailand-build-tp1d9z
```

All development goes here. Push to this branch. Open PRs against `main`.

## Credentials (private repo — safe to commit)

### Supabase

```
SUPABASE_PROJECT_REF=bvvsuollejcndcjjveal
SUPABASE_URL=https://bvvsuollejcndcjjveal.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://bvvsuollejcndcjjveal.supabase.co
EXPO_PUBLIC_SUPABASE_URL=https://bvvsuollejcndcjjveal.supabase.co

# Modern publishable key (use this for new code)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_yYLnG00XVemkgNmIXElHWA_S-2zLnRl
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_yYLnG00XVemkgNmIXElHWA_S-2zLnRl

# Legacy anon key (JWT, kept for compatibility)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dnN1b2xsZWpjbmRjamp2ZWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODI0NjMsImV4cCI6MjA5OTg1ODQ2M30.UBvJV8cq5ZEDxVit76QGnSyKfqwtGYYbPQ5VkmeNV38
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dnN1b2xsZWpjbmRjamp2ZWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODI0NjMsImV4cCI6MjA5OTg1ODQ2M30.UBvJV8cq5ZEDxVit76QGnSyKfqwtGYYbPQ5VkmeNV38

# Service-role key — NEVER expose on any client. Server/Edge Functions only.
# TODO: Get full key from Supabase Dashboard → Settings → API → service_role key
# Partial shown in setup: sb_secret_QvPyA... (fill in full value below)
SUPABASE_SERVICE_ROLE_KEY=FILL_IN_FROM_SUPABASE_DASHBOARD

# DB connection (for migrations / CLI)
DATABASE_URL=postgresql://postgres:[DB_PASSWORD]@db.bvvsuollejcndcjjveal.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=FILL_IN_FROM_SUPABASE_DASHBOARD
```

### Stripe (test mode)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Tu9iyBO3DIcuxwYHoGMYUvHTSlVih6S448K5fbJ0T26Ec0DemspjjTHmWDxMf5iPOn5wBFjVAhXD4uKAgnRIPgo00RW8a7eMo
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Tu9iyBO3DIcuxwYHoGMYUvHTSlVih6S448K5fbJ0T26Ec0DemspjjTHmWDxMf5iPOn5wBFjVAhXD4uKAgnRIPgo00RW8a7eMo
STRIPE_SECRET_KEY=sk_test_51Tu9iyBO3DIcuxwYIl9I1zfvcPJdq6JcBP77BHBTSzF6YpdO1dbLqcPT5Th14ScbebtHzuAsYEkyNrk7yX7Qg5Zk006MNzTKC4
STRIPE_WEBHOOK_SECRET=FILL_IN_AFTER_REGISTERING_WEBHOOK
```

### Still needed (stubs in place — see SETUP-TODO.md)

```
GOOGLE_MAPS_API_KEY=FILL_IN
GOOGLE_OAUTH_CLIENT_ID=FILL_IN
GOOGLE_OAUTH_CLIENT_SECRET=FILL_IN
LINE_CHANNEL_ID=FILL_IN
LINE_CHANNEL_SECRET=FILL_IN
RESEND_API_KEY=FILL_IN
POSTHOG_API_KEY=FILL_IN
SENTRY_DSN_CONSUMER=FILL_IN
SENTRY_DSN_ADMIN=FILL_IN
EXPO_ACCESS_TOKEN=FILL_IN
```

## Monorepo Structure

```
MaiThing/
├── apps/
│   ├── consumer/          Expo + Expo Router (iOS/Android/Web)
│   └── admin/             Next.js App Router (SSR, desktop-first)
├── packages/
│   └── shared/            Generated Supabase types + zod schemas + utils
├── supabase/
│   ├── migrations/        SQL migration files
│   └── seed.sql           Idempotent seed (~40 orgs, Bangkok/CM/Phuket/KK)
├── .github/workflows/     CI (typecheck, lint, test, build, migration check)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json           Root workspace
```

## Build Status / Progress

See `PROGRESS.md` for the live checklist. See `DECISIONS.md` for non-obvious choices. See `AUDIT.md` for self-audit cycle results.

## Agent Operating Rules

1. Read `RESCUEBITE-BUILD-BRIEF.md` for the full spec before making decisions.
2. All work goes on branch `claude/rescuebite-thailand-build-tp1d9z`.
3. Run the Section 20 self-audit loop after every unit of work (tsc, lint, tests, RLS check, secret scan, dead-code scan, bundle sanity, spec conformance, simplicity pass).
4. Record non-obvious decisions in `DECISIONS.md`.
5. Update `PROGRESS.md` as work completes.
6. Log each audit cycle in `AUDIT.md`.
7. **Never expose `SUPABASE_SERVICE_ROLE_KEY` on any client** — grep-check on every audit.
8. **Never commit secrets** — the `.env` files in `apps/*/` are gitignored; credentials live in this `CLAUDE.md` (private repo) and in CI environment variables.
9. TypeScript strict everywhere; no `any` without a comment.
10. Zero hardcoded strings — all user-facing text via i18next (TH + EN).

## Key Commands

```bash
# Install
pnpm install

# Link Supabase CLI to the cloud dev project
supabase link --project-ref bvvsuollejcndcjjveal

# Push schema migrations
supabase db push

# Run dev servers
pnpm --filter consumer start    # Expo (press w for web)
pnpm --filter admin dev         # Next.js admin

# Type check all packages
pnpm typecheck

# Lint
pnpm lint

# Generate Supabase TypeScript types
supabase gen types typescript --project-id bvvsuollejcndcjjveal > packages/shared/src/types/supabase.ts
```

## Supabase Project

- **Project name**: MaiThing
- **Project ref**: `bvvsuollejcndcjjveal`
- **Region**: ap-northeast-1 (Tokyo)
- **URL**: `https://bvvsuollejcndcjjveal.supabase.co`
- **Status**: ACTIVE_HEALTHY
