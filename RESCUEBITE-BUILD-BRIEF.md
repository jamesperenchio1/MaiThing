Build Brief: "RescueBite" — Thailand Surplus-Food Marketplace (Full Autonomous Build)
Paste this whole file into Claude Code as the initial brief. Build the entire system autonomously, in one continuous run, using subagents (Section 22). Do not pause for human confirmation. Make decisions using the Engineering Doctrine (Section 4) and record them in `DECISIONS.md`. Run the continuous self-audit loop (Section 20) after every unit of work. Only stop when the Definition of Done (Section 24) is fully satisfied. Where an external human-only credential is required, stub it properly and log it (Section 21) — never fake it, never stall on it.
1. What we're building
A surplus-food marketplace for all of Thailand connecting any food business — restaurants, cafes, bakeries, grocers, supermarkets, convenience stores, hotels, buffets, delis, juice bars — with buyers who reserve discounted food for self-pickup. Mimic Too Good To Go's model and UX closely (Surprise Bags, map-first discovery, reserve → pay → pick up in a window, "Food Hero" impact), then beat it on value transparency, fair cancellation, fast refunds, and merchant friction. Category-agnostic — never bias toward one food type.
2. Product principles

* Any food business, any category. Categories are filters, never constraints.
* Two listing modes (merchant chooses per listing): Surprise Bag (flat price, random contents, cheapest, zero per-item effort — the default) and Pick Your Own (merchant lists items with live stock + per-item discounted price; buyer builds a bag with +/− counters; full value transparency by construction).
* Value obvious without forcing photos. Photos/itemization are optional, never default; Surprise Bag transparency comes from numbers + dual rating; location branding photos are uploaded once and reused.
* Every tap feels instant — cache-first navigation, prefetch, optimistic updates (Section 14).
* Both sides transact in under 2 minutes.
* Must not choke at scale — smooth with hundreds of merchants in view (Section 14).
* Push work server-side — filtering, ranking, distance, aggregation, stock decrements in Postgres/Edge Functions.
* Nationwide but density-aware — degrades gracefully where listings are sparse.
3. Architecture & stack
One monorepo (pnpm + turborepo), one Supabase backend, three deployables. "Monolith" here means one source of truth, one autonomous build — not one process; the native app and admin genuinely must be separate targets.

* `apps/consumer` — Expo + Expo Router (universal: iOS + Android + Web) + TypeScript. One codebase → native apps + responsive web. Web is fine for MVP; the native phone app is the end goal and must be fully functional. Maps: `react-native-maps` (Google) native / web map (Google Maps JS or MapLibre) behind a shared interface.
* `apps/admin` — Next.js (App Router, RSC/SSR) + TypeScript. True SSR, desktop-first.
* `packages/shared` — shared TypeScript types (generated from the Supabase schema), zod schemas, constants, and cross-app utilities.
* Backend — Supabase Cloud (managed, not self-hosted): Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions. Use a dedicated cloud dev project (e.g. `rescuebite-dev`, separate from production) for the whole build; the Supabase CLI links to it (`supabase link`) and runs migrations/seed/tests against it. No Docker, no local database.
* Hosting & deploys (all managed, no self-hosting): admin (Next.js) and consumer web (Expo web export) → Vercel; consumer native builds → EAS (Expo Application Services) cloud builds; backend → Supabase Cloud; payments → Stripe; email → Resend; product analytics → PostHog Cloud; errors → Sentry; repo + CI → GitHub + Actions. During development the Expo and Next.js dev servers run locally as plain Node processes (no Docker) and talk to the cloud services over the network — so CC can run on any light machine or a Codespace.
On "server-side rendering" — the honest version: native renders native views, not HTML, so classic screen-SSR is N/A there; the equivalent is thin clients + heavy logic in Postgres RPCs/Edge Functions plus the instant-feel stack (Section 14). The consumer web target uses Expo Router static/server rendering + API routes. The admin uses real SSR/RSC. Experimental native RSC: do not depend on it.

* Payments — Stripe: Connect (Express) for merchant onboarding, payouts, and platform commission (`application_fee_amount`); PromptPay + cards; Billing for subscriptions.
* Auth — Supabase Auth: email, Google, LINE (all three, pluggable).
* Other: Expo Push + email (Resend); PostHog analytics; Sentry error monitoring; TanStack Query (server state) + minimal Zustand (UI state only); i18next TH/EN.
4. Engineering doctrine — slim, proper, non-negotiable
This governs every decision. When in doubt, re-read it.

* YAGNI. Build only what this brief requires. No speculative abstraction, no "framework for future needs," no config for things nobody asked for.
* Boring and proven over clever. Prefer the platform's built-in way (Supabase, Expo, Stripe SDKs) over hand-rolled cleverness. No new dependency without a clear, stated reason; prefer zero-dep solutions when trivial.
* Small, single-purpose units. Functions and components do one thing. Split a file when responsibilities diverge — not to hit a line count. No god-objects, no `utils.ts` dumping ground.
* Duplication is cheaper than the wrong abstraction. Extract shared code on the third real repeat, not the first guess. No premature "managers," "factories," "services," or wrapper layers.
* Flat over nested. Composition over inheritance. Readable over clever.
* One way to do each thing across the codebase — consistent patterns for data fetching, forms, errors, navigation.
* No dead code, ever. No commented-out blocks, no unused exports/params/deps, no "just in case." Delete on sight.
* No premature optimization beyond the explicit Section 14 requirements.
* Types are load-bearing. `strict` on; no `any` without a written reason; validate all external input with zod at the boundary.
* Every self-audit cycle includes a simplicity pass: re-read the diff and delete anything not earning its place (Section 20).
5. Roles
`buyer`, `merchant`, `admin` (`profiles.role`). A merchant user owns a merchant org with one or more locations.
6. Data model (Supabase / Postgres, RLS on every table)

* profiles — `id (=auth.uid)`, `role`, `display_name`, `phone`, `avatar_url`, `locale`, `home_lat`, `home_lng`, `reliability_score`, `created_at`
* merchant_orgs — `id`, `owner_id`, `name`, `description`, `logo_url`, `category`, `stripe_connect_account_id`, `subscription_tier`, `subscription_status`, `created_at`
* locations — `id`, `org_id`, `name`, `address_text`, `location (geography(Point,4326))`, `cover_url`, `photo_urls (text[])`, `hours (jsonb)`, `status (pending|active|paused)`, `rating_avg`, `value_rating_avg`, `rating_count`
* listings — `id`, `location_id`, `title`, `category`, `description`, `fulfillment_type (surprise_bag|pick_your_own)`, `photo_urls (text[], optional)`, `original_value_thb`, `price_thb`, `qty_total`, `qty_remaining`, `allergens (text[])`, `best_before_note`, `status (draft|active|sold_out|expired|cancelled)`, `auto_repeat (bool)`, `created_at`
* listing_items — `id`, `listing_id`, `name`, `photo_url (optional)`, `available_qty`, `reserved_qty`, `price_thb`, `original_price_thb`. Pickable inventory for pick_your_own; optional itemized display for surprise_bag.
* pickup_slots — `id`, `listing_id`, `starts_at`, `ends_at`, `capacity`, `reserved_count`.
* slot_templates — `id`, `location_id`, `label`, `start_time`, `end_time`, `weekdays (int[])`.
* orders — `id`, `buyer_id`, `listing_id`, `location_id`, `pickup_slot_id`, `qty`, `amount_thb`, `platform_fee_thb`, `status (reserved|paid|collected|cancelled|refunded|no_show)`, `pickup_code`, `qr_payload`, `stripe_payment_intent_id`, `created_at`, `collected_at`, `cancelled_at`
* order_items — `id`, `order_id`, `listing_item_id`, `name_snapshot`, `qty`, `unit_price_thb`.
* reviews — `id`, `order_id (unique)`, `buyer_id`, `location_id`, `overall_rating`, `value_rating`, `comment`, `photo_urls`, `merchant_reply`, `created_at`
* issue_reports — `id`, `order_id`, `reason`, `detail`, `photo_urls`, `status (open|auto_refunded|resolved|rejected)`, `resolution_note`, `created_at`
* chat_threads — `id`, `buyer_id`, `location_id`, `order_id (nullable)`, `last_message_at`
* chat_messages — `id`, `thread_id`, `sender_id`, `body`, `read_at`, `created_at`
* favorites — `buyer_id`, `location_id` (composite PK)
* demand_signals — `id`, `buyer_id`, `geohash`, `category`, `created_at`
* referrals — `id`, `referrer_id`, `referred_id`, `code`, `reward_status`, `created_at`
* user_impact — `profile_id`, `meals_saved`, `co2_kg_saved`, `thb_saved`, `hero_level`
* subscriptions — `id`, `subscriber_id`, `subscriber_type`, `stripe_subscription_id`, `tier`, `status`, `current_period_end`
* device_tokens — `id`, `profile_id`, `expo_push_token`, `created_at`
* platform_config — single row: `platform_fee_bps`, feature flags.
RPCs / server logic (server-side, tested):

* `listings_in_bounds(min_lat, min_lng, max_lat, max_lng, filters, limit)` — viewport-only active listings (anti-crash).
* `nearby_listings(lat, lng, radius_m, filters, cursor, limit)` — cursor-paginated, distance-sorted.
* `reserve_order(listing_id, slot_id, items[])` — atomic transaction: validates slot capacity + per-item stock, decrements both, creates order (+ order_items), returns code. Prevents overselling the last item under concurrency. Must have a concurrency test.
* Triggers keeping `rating_avg` / `value_rating_avg` / `user_impact` current.
Seed: ~40 diverse orgs across Bangkok, Chiang Mai, Phuket, Khon Kaen; mixed categories; some multi-location; both listing modes; varied slots + stock; buyer + admin test accounts. Idempotent, re-runnable, must stress the map.
7. Consumer experience
Buyer

* Onboard: Google/LINE/email → grant location → optional dietary prefs → optional referral.
* Discover (home): map-first, centered on the user's current location (fallback last-known → Thailand). Pins for locations with availability now; toggle to distance list. Filters: category, pickup time, max price, dietary, now-vs-later. Text search. Empty state → "notify me" (`demand_signal`).
* Instant detail: tap paints from cached list data immediately, then background-fills.
* Listing detail: branding/optional photos or category default; original value vs price + % saved prominent; dual rating; allergens + best-before; distance + directions; favorite; message store.
   * Surprise Bag: honest description + optional itemized preview; flat price; live "X left" counter.
   * Pick Your Own: item list, each with live stock counter + per-item price; +/− steppers bounded by stock; running total live. (muffin ×1, cake ×10, pie ×3 → pick 1+1+2.)
* Pickup-time selection: choose a merchant-approved slot.
* Reserve & pay: Stripe (PromptPay/card) via atomic `reserve_order`; get pickup code + QR + countdown.
* Cancellation: free + auto-refund up to 2h before slot start (shown on reserve screen).
* Pickup: show code/QR → merchant confirms → collected.
* After pickup: rate value + quality separately, optional photo; one-tap Report a problem → auto-refund common cases, status visible.
* Profile: order history, Food Hero impact, badges/streaks, favorites, referrals, saved searches.
Merchant

* Onboard: create org → add location (map pin, hours, logo + typical-items photos once) → connect Stripe → done. Auto-activate + verification hook.
* Publish in <60s: Surprise Bag or Pick Your Own; slots from templates or new; Repeat last + auto-repeat.
* Today view: live reservations per slot with name + code; confirm by QR/code; see chosen items for pick-your-own; adjust stock; sold-out.
* Multi-location switcher. Reputation & chat. Merchant analytics (Section 12).
8. Admin console (Next.js SSR)
Merchant/org approval + verification, suspend/reactivate; user management, roles, reliability/no-show monitoring, ban/flag; listing + content moderation; dispute/refund queue (override auto-refunds); platform analytics (GMV, take-rate, active users, retention cohorts, meals saved, CO₂, demand-vs-supply heatmap); platform config (commission, flags, tiers).
9. Differentiators
Value transparency (numbers + dual rating for Surprise Bag; see-and-choose for Pick Your Own); dual rating everywhere; fair visible cancellation; fast in-app refund/dispute; frictionless two-mode publishing; no-show protection (prepay + code + reliability + flagging); cold-start tooling (favorites + push, notify-me, demand heatmap, referrals); instant optimistic UI.
10. Payments, payouts & subscriptions (Stripe)
PaymentIntents (PromptPay/cards). Connect Express payouts: platform keeps `application_fee_amount`, rest auto-pays merchant; refunds reverse fees correctly. Merchant subscriptions (Billing): Free (higher commission) vs Pro (lower commission + advanced analytics + featured). Buyer premium (flag-gated): RescueClub — early access, zero service fee, priority slots. Webhooks in an Edge Function with signature verification; keep orders/subscriptions in sync. Idempotent webhook handling.
11. In-app chat
Buyer ↔ location via Supabase Realtime (`chat_threads`/`chat_messages`), order-linkable. Unread badges, push on new message, admin-visible moderation. Text + occasional photo.
12. Analytics & gamification
Merchant: sales, ฿ recovered, meals saved, trends, peak times, repeat rate, rating trends. Platform: admin. Product: PostHog across both funnels. Gamification: Food Hero levels, streaks, badges, per-user impact.
13. Thailand specifics
Thai default locale, full TH/EN i18n (zero hardcoded strings); Google + LINE + email; Stripe PromptPay + cards, ฿ THB, Thai phone handling, Buddhist-era date option; PDPA consent on signup + timestamp + basic export/delete.
14. Performance, scale & instant feel (hard requirements)

* Map: viewport-bounds query via `listings_in_bounds`; debounce region changes; cluster pins (supercluster); cap rendered markers.
* List: cursor pagination + FlashList virtualization; server-side sort/filter; never fetch all rows.
* DB: GIST on `location`; btree on status + slot times; materialized aggregates via triggers.
* Images: Supabase Storage + CDN transforms, thumbnails, lazy load.
* Instant feel: list returns enough to render detail header → tap uses it as `initialData` (no spinner) → background refetch fills rest → prefetch detail for rows entering viewport → optimistic mutations (favorite, counters, reserve) with rollback → Realtime on stock/slot counts so counters live-update. Skeletons + error/empty states everywhere. No dead ends.
15. Testing (must pass in the self-audit loop)

* Backend: SQL/pgTAP tests against the cloud dev project for every RLS policy (prove cross-user access is denied) and every RPC; a concurrency test for `reserve_order` (two racers, one item, exactly one wins). Webhook handler tests (valid/invalid signature, replay).
* Consumer: React Native Testing Library for critical components; Maestro E2E for the core loop, both listing modes.
* Admin: Playwright E2E for approval, moderation, refund override.
* Coverage: meaningful on the core loop and money paths; do not chase 100% on trivial code.
16. Security
RLS on every table (default-deny; tested). Service-role key never reaches any client — grep-check this in the audit. All external input validated with zod at the boundary. Stripe webhook signature verification. Storage bucket policies scoped per-user/per-org. Rate limiting on sensitive Edge Functions. No secrets in the repo (`.env` git-ignored, `.env.example` provided). Parameterized queries only. Auth guards on every protected route/screen. PII minimized and access-controlled.
17. Error handling & observability
Sentry in all three apps (env-gated). Error boundaries around every screen/route. Typed errors; user-friendly messages; never swallow errors silently. Structured logging in Edge Functions. Graceful offline/network handling with retry.
18. CI/CD & environments
GitHub Actions on PR: install, typecheck, lint, test, build both apps, Supabase migration check. `eas.json` with development / preview / production profiles. Admin deploy config for Vercel. Environments: three managed Supabase projects — dev (the build target), staging, production — all env-driven, no hardcoded config.
19. Conventions
TypeScript strict everywhere; ESLint + Prettier enforced (config committed); consistent import ordering; feature-based folder structure; shared types generated from the schema into `packages/shared` (never hand-duplicated); conventional-commit messages; small logical commits; a central design-system/theme (color, spacing, type scale, radii, dark mode) as the single styling source — clean, modern, intentional, not templated; accessibility (labels, contrast, ≥44px touch targets, screen-reader support).
20. Continuous self-audit loop (run after every unit of work)
After each meaningful change and before marking any workstream done, run and must be green:

1. `tsc --noEmit` — zero errors.
2. Lint + format clean.
3. All relevant tests pass (Section 15).
4. RLS check — every table has policies; cross-user denial test passes.
5. Secret scan — no service-role key on any client; no secrets committed.
6. Dead-code scan (`knip`/`ts-prune`) — no unused exports/files; dep check (`depcheck`) — no unused deps.
7. Bundle sanity — no accidental heavy imports.
8. Spec conformance — the workstream's DoD items are met.
9. Simplicity pass (mandatory): re-read the diff against Section 4; delete anything not earning its place; flatten needless nesting; remove premature abstraction. Log each cycle's findings + fixes in `AUDIT.md`. Loop until all nine pass. Keep `PROGRESS.md` updated as a live checklist; record non-obvious choices in `DECISIONS.md`.
21. Human prerequisites
Because the backend is cloud-hosted, a few accounts must exist before the autonomous run so CC can link, migrate, seed, and self-test against real services. Everything else is stubbed and logged.
Create these before starting the run (~15 min, list in `SETUP-TODO.md`):

* Supabase Cloud dev project — provide project ref, DB password, URL, anon key, service-role key via env. CC links the CLI to this and runs everything against it. Use a dedicated dev project, never production.
* Stripe account (test mode) — enable Connect; provide test API keys + webhook secret. CC builds and tests entirely in test mode.
Strongly recommended before the run (else CC stubs behind a clean interface and logs them):

* Google Maps API key; Google OAuth client; LINE Login channel; Resend, PostHog, Sentry keys; Expo/EAS account (for device + cloud builds).
Only for store submission, later — not needed to run: Apple Developer ($99/yr) + Google Play ($25).
For any credential absent at build time, implement the integration fully against env vars, provide a working mock/test-mode fallback behind a clean interface, and record the exact human step in `SETUP-TODO.md`. Never fake success; never stall waiting on an account.
22. Build plan — autonomous, subagent-orchestrated, one pass
Step 1 (foundation, do first): monorepo scaffold; link the Supabase CLI to the cloud dev project; full schema + RLS + PostGIS RPCs (incl. `listings_in_bounds`, `nearby_listings`, atomic `reserve_order`) + triggers; generated shared types; idempotent seed; ESLint/Prettier/TS configs; CI skeleton. Self-verify and freeze the schema. If a later workstream needs a schema change, update the migration + regenerate types + note it in `DECISIONS.md`, then continue — do not wait on a human.
Then fan out to subagents in parallel:

* A — Auth & onboarding (Google/LINE/email, buyer + merchant onboarding, PDPA).
* B — Discovery & listings (consumer) — map-first home centered on user, viewport queries, clustering, virtualization, filters/search, instant/optimistic detail, favorites. Owns Section 14.
* C — Merchant tools (consumer) — org/multi-location, <60s publish both modes, item inventory editor, slot templates, repeat/auto-repeat, today view, QR redemption, merchant analytics.
* D — Orders, slots & trust — pick-your-own counters, slot selection, atomic reserve/collect lifecycle, cancellation, dual-rating reviews, issue reports + auto-refund.
* E — Payments — Connect onboarding, PaymentIntents (PromptPay/cards), platform fee, payouts, refunds, subscriptions, verified webhooks.
* F — Chat & notifications — Realtime chat, Expo Push, email, preferences.
* G — Admin console — full Next.js SSR console (Section 8).
* H — Gamification & growth — impact, Food Hero, referrals, demand heatmap, PostHog.
Each subagent runs the Section 20 audit loop continuously and coordinates types through `packages/shared`.
Integration pass: wire everything; reconcile types; end-to-end test the core loop (publish → discover → reserve → pay → pick up → review) for BOTH modes on web and a native dev build; then payouts + subscriptions + chat + admin; run the full audit once more across the monorepo.
23. First-run quickstart (produce this in README and print it at the end)
The human should be able to see seeded merchants on a map, centered on them, and complete a reservation in Stripe test mode, in one sitting:

1. Prereqs: Node LTS, pnpm, the Expo Go app on your phone (Xcode/Android Studio optional). No Docker needed.
2. `pnpm install`
3. Create a Supabase Cloud dev project; put its URL + anon key + service-role key + DB password into `apps/consumer/.env` and `apps/admin/.env` (templates in `.env.example`).
4. `supabase link --project-ref <ref>`, then `supabase db push` (migrations) and run the seed. (`supabase db reset --linked` re-baselines the dev project when needed.)
5. Fill remaining env: Stripe test keys, Google Maps key, OAuth IDs (or leave OAuth blank and use email login for the first run). See `SETUP-TODO.md`.
6. `pnpm --filter consumer start` → press w for web, or scan the QR in Expo Go to run on your phone instantly.
7. Admin: `pnpm --filter admin dev` → open the printed localhost URL.
8. When you need maps / Stripe / push working on device: `eas build --profile development` (needs a free Expo account), install the dev build, then `pnpm --filter consumer start --dev-client`.
9. Store builds (later, only when it works): `eas build --profile production` → `eas submit` (needs Apple/Google accounts).
24. Definition of Done (do not stop until all true)

* Core loop works both listing modes on web AND a native dev build: publish → discover (map centered on user) → build/reserve → pay (Stripe test) → pickup code/QR → merchant confirm → dual-rating review.
* Atomic reservation proven under concurrency (last-item race test green).
* Payouts (Connect), refunds, and subscriptions wired and tested in test mode.
* Chat, notifications, favorites, referrals, Food Hero impact all functional.
* Admin console: approval, moderation, dispute override, analytics + demand heatmap working.
* All Section 20 audits green across the monorepo; `AUDIT.md`, `PROGRESS.md`, `DECISIONS.md`, `SETUP-TODO.md`, and README complete.
* Zero hardcoded strings (TH/EN both load), zero dead code, zero unused deps, no secrets committed, RLS default-deny on every table.
* CI green. `SETUP-TODO.md` contains only external human-account items — nothing else blocks running the app.
