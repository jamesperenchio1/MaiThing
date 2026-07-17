# MaiThing Build Progress

Last updated: 2026-07-17

## Foundation (Step 1)

- [x] Monorepo scaffold (pnpm + turborepo)
- [x] `packages/shared` — Supabase types (placeholder), zod schemas, utils
- [x] Supabase migration: full schema (all 18 tables + triggers + RPCs + RLS)
- [x] Supabase seed: ~22 orgs across Bangkok, Chiang Mai, Phuket, Khon Kaen
- [x] ESLint + Prettier config
- [x] TypeScript strict base config
- [x] `CLAUDE.md` with credentials and agent instructions
- [x] CI workflow skeleton
- [x] `PROGRESS.md`, `DECISIONS.md`, `SETUP-TODO.md`, `AUDIT.md`
- [ ] Apply migration to cloud Supabase project (needs service role key)
- [ ] Regenerate types from live schema

## A — Auth & Onboarding
- [x] Email sign-in/sign-up screens
- [x] PDPA consent on signup
- [x] Google OAuth (wired, needs API keys)
- [ ] LINE OAuth
- [ ] Buyer onboarding flow (location grant, dietary prefs, referral)
- [ ] Merchant onboarding flow

## B — Discovery & Listings (Consumer)
- [x] Discover screen (map + list toggle)
- [x] `listings_in_bounds` RPC wired
- [x] Map with Supercluster pin clustering
- [x] FlashList-based list view
- [x] Debounced region change
- [ ] Listing detail screen
- [ ] Filters / search
- [ ] Favorites
- [ ] Instant detail (initialData from list cache)
- [ ] Prefetch on viewport entry
- [ ] Optimistic favorite toggle
- [ ] Realtime stock updates

## C — Merchant Tools
- [ ] Merchant org creation
- [ ] Location creation (map pin)
- [ ] <60s publish (both modes)
- [ ] Slot templates
- [ ] Today view
- [ ] QR scan confirmation
- [ ] Merchant analytics

## D — Orders, Slots & Trust
- [ ] Slot selection UI
- [ ] Pick-your-own item builder
- [ ] `reserve_order` RPC call + pickup code display
- [ ] Order status tracking
- [ ] Cancellation flow
- [ ] Dual-rating reviews
- [ ] Issue reports + auto-refund

## E — Payments
- [ ] Stripe Connect onboarding
- [ ] PaymentIntent (PromptPay + card)
- [ ] Webhook Edge Function
- [ ] Refunds
- [ ] Subscriptions (Free/Pro)

## F — Chat & Notifications
- [ ] Realtime chat (threads + messages)
- [ ] Expo Push integration
- [ ] Email (Resend)
- [ ] Notification preferences

## G — Admin Console
- [x] Next.js App Router scaffold
- [x] Dashboard stats page (SSR)
- [ ] Merchant approval queue
- [ ] User management
- [ ] Listing moderation
- [ ] Dispute/refund override
- [ ] Platform analytics
- [ ] Demand heatmap

## H — Gamification & Growth
- [ ] Food Hero levels + impact display
- [ ] Referral system
- [ ] Demand signals (notify-me)
- [ ] PostHog integration

## Infrastructure
- [ ] Sentry (all 3 apps)
- [ ] EAS build profiles
- [ ] Vercel deploy config
- [ ] Full pgTAP test suite
- [ ] Concurrency test for reserve_order
- [ ] Maestro E2E (consumer)
- [ ] Playwright E2E (admin)
