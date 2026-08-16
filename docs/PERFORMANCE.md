# Performance Issues — Maithing

Documented findings from profiling the mock-data dev build. Ordered by estimated impact.

---

## 1. 50 ms artificial sleep per repository call (HIGH)

**File:** `src/repositories/mock.ts`, top of file — `const sleep = (ms: number) => …`

Every single repository method `await sleep(50)` before returning. The home screen triggers ≥ 6 concurrent queries on mount (listings, merchants, categories, impact, profile, notifications). That's 300 ms of pure sleep before a single byte of data is available, plus React re-renders after each settles.

**Fix:** Remove `sleep()` from all mock methods. If you want realistic latency during demo, add a single 100 ms sleep only to `getListings` / `getMerchants`, controlled by an env flag.

---

## 2. FlashList `ListHeaderComponent` recreated every render (MEDIUM)

**Files:** `app/(customer)/(tabs)/index.tsx`, `wallet.tsx`, `orders.tsx`

`listHeader` was defined as a plain `const` inside the component body, meaning a new React element is created on every render. FlashList treats a changed `ListHeaderComponent` reference as a full unmount+remount — which kills entering animations and causes an extra layout pass.

**Fix (done for carousel):** Wrap in `useMemo`. For wallet/orders, either memoize or extract to a named component outside the render function.

---

## 3. `Dimensions.get('window')` at module level for carousel width (MEDIUM)

**File:** `app/(customer)/(tabs)/index.tsx`

`slideWidth` was captured once at module load. On tablets and during orientation changes the value is stale, causing carousel slides to be the wrong width.

**Fix (done):** Use `useState(Dimensions.get('window').width)` with an `onLayout` callback on the ScrollView to re-measure.

---

## 4. No `staleTime` on hot queries (MEDIUM)

TanStack Query's default `staleTime` is `0`, so every focus event (switching tabs, backgrounding/foregrounding) triggers a background refetch. Screens with 6+ queries = 6 concurrent network calls on every tab switch.

**Fix:** Set a project-wide default in `src/services/queryClient.ts`:

```ts
defaultOptions: {
  queries: {
    staleTime: 5 * 60 * 1000,   // 5 minutes — already in the file for mock
    gcTime: 10 * 60 * 1000,
  },
},
```

Verify this is applied to the actual `QueryClient` instance (check `queryClient.ts`).

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

## 8. No React.memo on heavy list items (LOW)

`ListingCard`, `MerchantCard`, and `TransactionItem` are re-created on every parent render even when their props haven't changed. With FlashList rendering 20+ items, this adds up.

**Fix:** Wrap with `React.memo` and ensure stable callback props (use `useCallback`).

---

## Quick wins (can be done in one session)

1. Remove 50 ms sleep from mock (or gate it behind `EXPO_PUBLIC_MOCK_LATENCY=1`)
2. Confirm `staleTime: 5min` in QueryClient
3. Replace `<Image>` with `<ExpoImage>` in ListingCard and carousel
4. `React.memo` on ListingCard and MerchantCard
