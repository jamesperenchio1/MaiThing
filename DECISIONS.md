# Architecture Decisions

## 2026-07-17 — Initial build

### D001: Supabase publishable key vs. anon key

Using `sb_publishable_*` (modern format) for new code in both apps. Keeping the legacy JWT anon key in `CLAUDE.md` for backward compat with any tooling that expects it. Both keys exist in the Supabase project and are non-disabled.

### D002: App-level `.env` files gitignored; credentials in `CLAUDE.md`

Per user instruction: repo is private, so credentials are committed in `CLAUDE.md` for agent continuity. App-specific `.env` files (which Next.js and Expo pick up automatically) are gitignored to avoid accidental exposure if visibility ever changes. Agents reading `CLAUDE.md` copy the values into their local `.env` files before running.

### D003: Supabase seed uses fixed UUIDs

Seed data uses deterministic `aaaaaaaa-...`, `bbbbbbbb-...` UUIDs so the seed is idempotent (`ON CONFLICT DO NOTHING`). Running it multiple times is safe.

### D004: Supercluster for pin clustering (not Google Maps clustering)

Using the `supercluster` JS library for clustering because it works identically on web and native, gives us full control over cluster rendering, and avoids native-only APIs that would break the web target.

### D005: FlashList over FlatList

Replaced React Native's built-in FlatList with `@shopify/flash-list` for the listing list view per Section 14 requirements. FlashList uses a recycling strategy that eliminates the blank-row flicker on fast scroll.

### D006: Advisory locks in reserve_order

`pg_advisory_xact_lock` scoped to `(listing_id ++ slot_id)` hash prevents the last-item race without table-level locking. Combined with `FOR UPDATE` on the listing and slot rows, this ensures exactly-once semantics under concurrent reservations.

### D007: No Docker, Supabase Cloud only

Per build brief Section 3 and Section 21: using the cloud dev project (`bvvsuollejcndcjjveal`) directly. No local DB, no Docker. The Supabase CLI links to this project and runs migrations against it.

### D008: i18n strings — Thai default

Default locale is `th`. The `en` locale is a full fallback. Zero hardcoded user-facing strings anywhere in the codebase. All strings go through `t()` from react-i18next.

## 2026-07-18 — Shared package / schema foundation

### D009: createLocationSchema transforms lat/lng to PostGIS WKT

The API keeps the friendly lat/lng shape, but the schema transforms it into `SRID=4326;POINT(lng lat)` for direct insertion into the `geography(Point,4326)` column. Exports `CreateLocationInput` for the raw input type.

### D010: generatePickupCode uses Node crypto

Replaced `Math.random` with `node:crypto.randomInt` for cryptographically secure 6-character alphanumeric codes. This is intended for server/edge function contexts; if it is ever needed in the Expo client, a React Native-compatible crypto polyfill will be required (not added now — YAGNI).

### D011: Row + create schemas added for all core tables

Added Zod schemas for `orders`, `pickup_slots`, `listing_items`, `favorites`, `chat_threads`, `chat_messages`, `device_tokens`, `referrals`, `subscriptions`, and `demand_signals` to keep app-level validation in sync with the generated Supabase types. Also added `issueStatusSchema` and `orderItemRowSchema` where the DB shape differs from the API shape.

## 2026-07-19 — Consumer web export fix

### D012: Metro web aliases for native-only modules

`expo export --platform web` failed because Metro attempted to bundle native-only `react-native` internals (`TextInputState`) and native-only packages (`react-native-maps`, `@stripe/stripe-react-native`). Rather than trying to make the entire RN core web-safe, we added a targeted `apps/consumer/metro.config.js` that aliases only those modules to small web stubs when `platform === 'web'`. The native iOS/Android builds are unaffected.

### D013: Web stubs for native-only packages

- `apps/consumer/react-native-maps-web-stub.js` returns null map components.
- `apps/consumer/stripe-react-native-web-stub.js` returns no-op payment sheet functions.

These stubs are intentionally minimal; the web target shows a "Stripe not configured" fallback for checkout, which is acceptable for the MVP per the brief's native-first emphasis.

### D014: Placeholder app assets

Created simple green placeholder PNGs for `icon.png`, `favicon.png`, and `notification-icon.png` so the Expo web export and native build pipelines stop warning about missing assets. These can be replaced with brand assets later without code changes.

### D015: Root `pnpm.overrides` to keep the React 18 type tree

The workspace mixes React 18 (Expo consumer) and React 19 (Next.js admin). `pnpm-workspace.yaml` already had `dedupe-peer-dependents: false`, but a global `.pnpm/node_modules/@types/react` symlink still pointed to React 19 types, causing `Tabs`, `Stack`, `FlashList`, `MapView`, and `Marker` JSX errors in the consumer app. We added a root `pnpm.overrides` for `@types/react` and `@types/react-dom` to the React 18 versions used by the consumer app. Both the consumer and admin typechecks remain green, and the lockfile is simpler than a per-package override strategy.
