# MaiThing / RescueBite

Thailand surplus-food marketplace — a Too Good To Go-style app connecting food businesses with buyers who rescue discounted food for self-pickup.

## Stack

- **Consumer app**: Expo + Expo Router + React Native (iOS / Android / Web)
- **Admin console**: Next.js App Router (SSR)
- **Shared**: `packages/shared` — Supabase-generated types, zod schemas, utilities
- **Backend**: Supabase Cloud (Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions)
- **Payments**: Stripe Connect (merchant onboarding) + PaymentIntents (PromptPay / cards)
- **Monitoring**: Sentry (errors), PostHog (analytics) — both env-gated stubs
- **CI**: GitHub Actions (typecheck, lint, format, knip, tests, shared/admin/consumer-web builds)

## Quickstart

1. **Prerequisites**: Node.js 22, pnpm, the Expo Go app on your phone (optional).

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Supabase dev project**:
   - Create a Supabase Cloud project.
   - Copy the project ref, URL, anon key, and **service-role key** into `CLAUDE.md` (private repo reference).
   - Link and push migrations:
     ```bash
     supabase link --project-ref <your-project-ref>
     supabase db push
     supabase db seed --linked
     ```
   - Regenerate types:
     ```bash
     supabase gen types typescript --project-id <your-project-ref> > packages/shared/src/types/supabase.ts
     ```

4. **Environment variables**:
   - Copy `apps/consumer/.env.example` to `apps/consumer/.env` and fill in Supabase URL/keys.
   - Copy `apps/admin/.env.example` to `apps/admin/.env` and fill in Supabase URL/keys.
   - Fill Stripe test keys, Google Maps key, OAuth IDs, and optional third-party keys (Resend, PostHog, Sentry, LINE) in `CLAUDE.md` and app `.env` files.
   - See `SETUP-TODO.md` for the exact human-only steps.

5. **Run consumer app**:
   ```bash
   pnpm --filter consumer start
   ```
   - Press `w` for web.
   - Scan the QR with Expo Go to run on your phone.
   - For a native dev build: `eas build --profile development`, install, then `pnpm --filter consumer start --dev-client`.

6. **Run admin console**:
   ```bash
   pnpm --filter admin dev
   ```
   Open the printed localhost URL.

7. **Build for production**:
   - Web: `pnpm --filter consumer build:web` outputs to `apps/consumer/dist`.
   - Native: `eas build --profile production`.
   - Admin: `pnpm --filter admin build`.

## Useful commands

```bash
pnpm typecheck          # Type-check all packages
pnpm lint               # Lint all packages
pnpm format:check       # Check Prettier formatting
pnpm format:write       # Fix formatting
pnpm knip               # Dead-code / unused-dependency scan
pnpm --filter @maithing/shared test      # Run shared unit tests
pnpm --filter @maithing/shared build     # Build shared package
pnpm --filter @maithing/admin build      # Build admin console
pnpm --filter @maithing/consumer build:web  # Build consumer web export
```

## Project structure

```
MaiThing/
├── apps/
│   ├── consumer/          # Expo + Expo Router consumer app
│   └── admin/             # Next.js admin console
├── packages/
│   └── shared/            # Generated Supabase types, zod schemas, utilities
├── supabase/
│   ├── migrations/        # SQL migrations
│   └── functions/         # Supabase Edge Functions
├── .github/workflows/     # CI
├── CLAUDE.md              # Agent reference + credentials (private repo)
├── SETUP-TODO.md          # Human-only credential setup steps
├── PROGRESS.md            # Live build checklist
├── AUDIT.md               # Self-audit log
└── DECISIONS.md           # Engineering decisions
```

## Test accounts

The seed creates a buyer (`buyer@example.com` / `BuyerPassword123!`) and an admin (`admin@example.com` / `AdminPassword123!`). Merchants are created by signing up and creating an org.

## Notes

- The consumer app uses `react-native-maps` and `@stripe/stripe-react-native` on native; web export uses `.web.tsx` and Metro aliases to stub native-only modules.
- Some third-party integrations (Google/LINE OAuth, Resend, PostHog, Sentry, EAS) require human-provided credentials. They are stubbed with clean fallbacks until keys are supplied.
- See `SETUP-TODO.md` for the exact steps to enable each integration.

## License

Private — see repository settings.
