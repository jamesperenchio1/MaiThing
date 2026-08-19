# Performance Issues — Maithing

Documented findings from profiling the mock-data dev build. Ordered by estimated impact. This is a
living list, not a fixed audit — re-verify against the current code before trusting an item, and
update it as fixes land or new issues surface.

**Last refreshed:** 2026-08-19. Several items below (marked ✅ Fixed) have already been resolved
since this list was first written; they're kept for history/context rather than deleted.

---

## 1. ~~50 ms artificial sleep per repository call~~ ✅ Fixed

`src/repositories/mock.ts` no longer has a `sleep()` call in its methods — verified by grep, no
matches remain. (This item only ever applied to mock mode; the app now also runs against a real
Supabase backend by default in this repo, which has its own real network latency instead.)

---

## 2. FlashList `ListHeaderComponent` recreated every render (MEDIUM — still open on home)

**Files:** `app/(customer)/(tabs)/index.tsx` (still a plain `const listHeader = (...)` as of this refresh — confirm with `grep -n listHeader`), `wallet.tsx`, `orders.tsx`.

`listHeader` is defined as a plain `const` inside the component body, meaning a new React element is created on every render. FlashList treats a changed `ListHeaderComponent` reference as a full unmount+remount — which kills entering animations and causes an extra layout pass.

**Fix:** Wrap in `useMemo`, or extract to a named component outside the render function.

---

## 3. ~~`Dimensions.get('window')` at module level for carousel width~~ ✅ Fixed

`app/(customer)/(tabs)/index.tsx` now uses `useState(Dimensions.get('window').width)` for
`slideWidth`, re-measured via an `onLayout` callback — confirmed current.

---

## 4. ~~No `staleTime` on hot queries~~ ✅ Fixed

`src/services/queryClient.ts` sets `staleTime: 1000 * 60 * 5` and `gcTime: 1000 * 60 * 60 * 24` on
the `QueryClient` instance — confirmed current, applies to both mock and Supabase mode.

---

## 5. Large seed arrays iterated on every query (LOW-MEDIUM)

**File:** `src/repositories/seed.ts` / `mock.ts`

`LISTINGS` contains 100+ items. Every `getListings()` call filters, sorts, and slices the entire array synchronously on the JS thread. With 50 ms sleep this is masked, but removing the sleep exposes 5–15 ms of synchronous work per call that blocks the JS thread.

**Fix:** Pre-compute frequently-used derived arrays (active listings sorted by distance, by discount, etc.) once at startup and cache them. Or move to `useMemo` inside hooks so the work runs off the render path.

---

## 6. Image loading — no placeholder / progressive loading (LOW)

Listing cards and the home carousel display remote images (Unsplash URLs) with no loading state. On slow connections the card area is blank until the image arrives, causing layout shifts.

**Fix:** Use `expo-image` (already in the Expo SDK) instead of React Native's `Image`. It supports `placeholder`, `contentFit`, and a built-in shimmer — drop-in replacement for `<Image source={...} />`.

---

## 7. `LogBox.ignoreAllLogs(true)` masks real warnings (LOW)

**File:** `app/_layout.tsx`

Suppressing all logs hides legitimate performance warnings (e.g. FlashList missing `estimatedItemSize`, Reanimated worklet warnings). Remove this in non-demo builds.

---

## 8. ~~No React.memo on heavy list items~~ ✅ Mostly fixed

`src/components/composite/ListingCard.tsx` and `MerchantCard.tsx` are both wrapped in
`React.memo` — confirmed current. There's no separate `TransactionItem` component in the current
codebase (wallet transaction rows are rendered inline) — if a dedicated component gets extracted
later, memoize it too.

---

## Remaining open items

1. Wrap `listHeader` in `useMemo` on the home screen (#2).
2. Replace `<Image>` with `expo-image` in `ListingCard` and the home carousel for placeholder/shimmer support (#6).
3. Remove/narrow `LogBox.ignoreAllLogs(true)` so real warnings surface again (#7).
4. Pre-compute or memoize derived arrays over the mock seed data if mock mode's synchronous filtering becomes a bottleneck (#5) — lower priority now that Supabase mode is the default in this repo and the sleep from #1 is gone.
