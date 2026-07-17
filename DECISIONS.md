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
