# MaiThing Build Progress

Last updated: 2026-07-19

## Foundation (Step 1)

- [x] Monorepo scaffold (pnpm + turborepo)
- [x] `packages/shared` — Supabase types (generated from live schema), zod schemas, utils
- [x] Supabase migration: full schema (all 20 tables + triggers + RPCs + RLS)
- [x] Supabase seed: ~22 orgs across Bangkok, Chiang Mai, Phuket, Khon Kaen
- [x] ESLint + Prettier config
- [x] TypeScript strict base config
- [x] `CLAUDE.md` with credentials and agent instructions
- [x] CI workflow (typecheck, lint, format, test, knip, build admin + shared + consumer web)
- [x] `PROGRESS.md`, `DECISIONS.md`, `SETUP-TODO.md`, `AUDIT.md`
- [x] Apply migration to cloud Supabase project
- [x] Regenerate types from live schema
- [x] Knip dead-code/dependency audit configuration

## A — Auth & Onboarding

- [x] Email sign-in/sign-up screens
- [x] PDPA consent on signup
- [x] Google OAuth (wired, needs API keys)
- [~] LINE OAuth (stubbed; hidden when no credentials)
- [~] Buyer onboarding flow (location grant wired; dietary prefs + referral stubbed)
- [x] Merchant onboarding flow (org creation)

## B — Discovery & Listings (Consumer)

- [x] Discover screen (map + list toggle)
- [x] `listings_in_bounds` RPC wired
- [x] Map with Supercluster pin clustering
- [x] FlashList-based list view
- [x] Debounced region change
- [x] Listing detail screen (both surprise_bag + pick_your_own modes)
- [x] SlotPicker component
- [x] PickYourOwnBuilder component with +/− steppers + running total
- [x] Instant detail (placeholderData from list cache)
- [x] Map pin press → navigate to detail
- [x] Filters / search UI
- [x] Favorites + optimistic toggle
- [~] Prefetch on viewport entry (architecture in place, not fully wired)
- [x] Realtime stock updates

## C — Merchant Tools

- [x] Merchant org creation
- [x] Location creation (lat/lng + address text)
- [x] <60s publish (both surprise_bag and pick_your_own)
- [~] Slot templates (schema only; UI not built)
- [x] Today view
- [x] QR/manual collection confirmation
- [x] Merchant analytics

## D — Orders, Slots & Trust

- [x] Slot selection UI (SlotPicker embedded in listing detail)
- [x] Pick-your-own item builder (PickYourOwnBuilder)
- [x] `reserve_order` RPC call + pickup code display
- [x] Checkout screen (qty picker, total, confirm CTA)
- [x] Orders list tab (FlashList, color-coded status badges)
- [x] Order detail screen (large pickup code, pickup window, location, cancel)
- [x] Cancellation flow (2h-before deadline guard via `cancel_order` RPC)
- [x] Dual-rating reviews (post-collection prompt)
- [x] Issue reports + auto-refund path

## E — Payments

- [~] Stripe Connect onboarding (backend schema + Edge Function stubs; UI needs credentials)
- [x] PaymentIntent (PromptPay/card) via `create-payment-intent` Edge Function
- [x] Webhook Edge Function (`stripe-webhook`) with signature verification
- [x] Refunds (`refund-payment` Edge Function)
- [~] Subscriptions (Free/Pro schema in place; UI gated by credentials)

## F — Chat & Notifications

- [x] Realtime chat (threads + messages) UI + hooks
- [x] Expo Push integration — deps installed + token registration wired; needs credentials for real delivery
- [x] Email (Resend) — stubbed, logs only
- [x] Notification preferences schema + UI

## G — Admin Console

- [x] Next.js App Router scaffold
- [x] Dashboard stats page (SSR) with date filters + demand heatmap
- [x] Merchant approval queue
- [x] User management
- [x] Listing moderation
- [x] Dispute/refund override
- [x] Platform analytics

## H — Gamification & Growth

- [x] Food Hero levels + impact display
- [x] Referral system — schema + UI
- [~] Demand signals (notify-me) — `demand_signals` table used in admin heatmap; consumer CTA stubbed
- [x] PostHog integration — stubbed, no-op when key missing

## Infrastructure

- [x] Sentry (all 3 apps) — stubbed, no-op when DSN missing
- [x] EAS build profiles — `app.json` configured; needs `eas init` when ready for store builds
- [x] Vercel deploy config (vercel.json in place; admin build green; consumer web export green)
- [x] Shared unit tests (vitest)
- [~] Concurrency test for `reserve_order` — implemented, skipped until `SUPABASE_SERVICE_ROLE_KEY` is provided
- [x] Maestro E2E (consumer) — stubbed
- [x] Playwright E2E (admin) — stubbed

## Known Blockers / Human Prerequisites

- `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_PASSWORD` must be filled in `CLAUDE.md` to run the concurrency test against the cloud project and to push migrations from a fresh environment.
- Stripe live/test keys, Google/LINE OAuth, maps keys, Resend, PostHog, Sentry, and EAS are stubbed and logged in `SETUP-TODO.md`.
- Consumer web export builds, but the web target is a limited preview; native iOS/Android remains the primary goal.
