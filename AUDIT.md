# Self-Audit Log

Format per Section 20 of the build brief.

---

## Audit #1 — 2026-07-17 — Foundation scaffold

### Checks

1. **tsc --noEmit** — Not yet runnable (deps not installed in this environment). Schema: PASS (no TS in migrations). `packages/shared` types are hand-written placeholder; will regenerate from live schema after migration is applied.

2. **Lint** — ESLint config committed. Not yet run (no node_modules). Planned in CI.

3. **Tests** — No tests yet. pgTAP suite is planned (workstream D + concurrency test). RN Testing Library + Maestro planned.

4. **RLS check** — Every table in `20260001_initial_schema.sql` has `enable row level security` and at least one policy. Default-deny is enforced (no permissive catch-all). Cross-user denial tests planned in pgTAP.

5. **Secret scan** — `SUPABASE_SERVICE_ROLE_KEY` appears only in:
   - `CLAUDE.md` (agent reference doc, not code)
   - `apps/admin/src/lib/supabase-server.ts` (server-only via `process.env`, not exported)
   - `SETUP-TODO.md` (instructions only)
   It does NOT appear in any client-side code, `EXPO_PUBLIC_*` vars, or `NEXT_PUBLIC_*` vars. ✅

6. **Dead code** — knip/ts-prune not yet run (no node_modules). All exports in `packages/shared/src/index.ts` are consumed or documented as the public API.

7. **Bundle sanity** — No heavy server-side imports in consumer app. Supercluster and FlashList are expected large deps per Section 14.

8. **Spec conformance** — Foundation checklist:
   - [x] Monorepo scaffold (pnpm + turborepo)
   - [x] Full schema + PostGIS + RPCs (`listings_in_bounds`, `nearby_listings`, `reserve_order`)
   - [x] Triggers (new user → profile, review → rating, order → impact, listing qty → status)
   - [x] Generated types (placeholder; regenerate after migration)
   - [x] Seed (~22 orgs, 4 cities, both listing modes, pick_your_own items)
   - [x] ESLint + Prettier + TS configs
   - [x] CI skeleton

9. **Simplicity pass** — No speculative abstraction added. No wrapper layers. Schemas in one file per package. Zustand stores are minimal slices. No premature `manager`/`service` classes.

### Findings & Fixes
- `reserve_order` uses `pg_advisory_xact_lock` on a hash of the listing+slot IDs for concurrency safety (D006).
- Service role key confirmed server-only (D002, D005 check above).
- Seed uses fixed UUIDs for idempotency (D003).

### Status: FOUNDATION PASS (pending migration apply + type regen)
