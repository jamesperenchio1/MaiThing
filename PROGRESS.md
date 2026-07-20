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
- [x] Buyer onboarding flow (location grant wired; referral wired in sign-up; dietary prefs toggles in profile)
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
- [x] Prefetch on viewport entry (FlashList onViewableItemsChanged wired; 150ms debounce, 30% threshold)
- [x] Realtime stock updates

## C — Merchant Tools

- [x] Merchant org creation
- [x] Location creation (lat/lng + address text)
- [x] <60s publish (both surprise_bag and pick_your_own)
- [x] Slot templates — full UI built: list, create, delete in `/(merchant)/listings/templates`; "Load from template" shortcut in new listing form
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
- [x] Webhook Edge Function (`stripe-webhook`) with signature verification — endpoint created and deployed
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
- [x] Demand signals (notify-me) — CTA wired in listing detail; toggles per-listing notify-me in `demand_signals`
- [x] PostHog integration — stubbed, no-op when key missing

## Infrastructure

- [x] Sentry (all 3 apps) — stubbed, no-op when DSN missing
- [x] EAS build profiles — `app.json` configured; needs `eas init` when ready for store builds
- [x] Vercel deploy config (vercel.json in place; admin build green; consumer web export green)
- [x] Shared unit tests (vitest) — all passing including `reserve_order` concurrency test
- [x] Maestro E2E (consumer) — stubbed
- [x] Playwright E2E (admin) — stubbed

## Known Blockers / Human Prerequisites

- Stripe Connect onboarding UI and subscriptions UI need live Stripe credentials to be fully enabled.
- Google/LINE OAuth, maps keys, Resend, PostHog, Sentry, and EAS are stubbed and logged in `SETUP-TODO.md`.
- Consumer web export builds, but the **web runtime preview is currently broken** due to a duplicate React runtime issue in the Metro bundle when using `pnpm` + `expo-router` web. Native iOS/Android (Expo Go / EAS) is the primary target and remains unaffected.

## Section 20 Audit Status

- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `pnpm format:check` ✅
- `pnpm knip` ✅
- `pnpm --filter @maithing/shared test` ✅ (19 tests)
- `pnpm --filter @maithing/admin build` ✅
- `pnpm --filter @maithing/consumer build:web` ✅ (bundle builds; runtime preview blocked as noted above)
- Supabase migrations pushed and verified ✅
- Edge Functions deployed ✅

