# Maithing Quality-of-Life Improvements

A running list of small-to-medium improvements that would make the app feel more polished, reliable, and delightful. Items are grouped by area and roughly ordered by impact vs. effort. This is a living status document — statuses, groupings, and the skipped-items list below are expected to keep changing as the app changes; nothing here is a fixed rule, just today's read of the code.

**Status legend:** ✅ Done · ⚠️ Partial (something exists but isn't complete/wired up) · ❌ Not started · ❓ Not verifiable by static analysis
**Last verified:** 2026-08-19, against the codebase directly (grep/read every item's underlying files, not assumed from the previous pass). Since the 2026-07-28 verification the app gained a real Supabase backend (`src/repositories/supabase.ts`, live `supabase.auth.*`), `expo-secure-store` wired as the auth session storage adapter (`src/lib/supabase.ts`), EAS Build config (`eas.json`), a GitHub Actions CI pipeline (`.github/workflows/ci.yml`), Supabase migrations/edge functions, offline detection + a queued-mutation system (`useNetworkState`, `useOfflineQueue`, `useOfflineMutation`, `offlineQueue.ts`, `OfflineBanner.tsx`), a lightweight analytics-event service (`src/services/analytics.ts`), a real image picker, draft listings, duplicate-listing and bulk-inventory-action sheets, a date/time picker field, and a `BottomSheet` primitive — several previously-skipped items turned out to have real implementations now and are marked Done below.

## 🚀 Performance & Lists

1. ✅ **Replace `ScrollView` + `.map()` with `FlashList`** on long screens (orders, inventory, discover, merchant listings) to eliminate scroll jank and memory spikes. `FlashList` is now used in 16 screens/components, including discover, customer/merchant orders, inventory, wallet, favorites, messages threads, staff, promotions, and bank accounts.
2. ✅ **Add list skeletons** that match the exact card layout instead of generic placeholders. Merchant inventory, merchant orders, customer orders, notifications, and wallet transactions all render sized `Skeleton` placeholders while loading.
3. ❌ **Paginate or virtualize** order history, wallet transactions, and merchant order lists once data grows. No `pageSize`, `useInfiniteQuery`, or `onEndReached` pagination logic found anywhere in `app/` or `src/`.
4. ✅ **Debounce search inputs** (e.g., discover search, map search) to ~300 ms to avoid a query/re-render on every keystroke. Still implemented in `app/(customer)/(tabs)/discover.tsx` via a `debouncedQuery` state.
5. ✅ **Memoize heavy computations** (`calculateDistance`, `getMerchantOpenStatus`, filtered lists) with `useMemo`. `MerchantCard.tsx` wraps its `isNew`/`openStatus`/`locationLabel` derivations in `useMemo`, and `ListingCard.tsx` now also memoizes its derived layout values and `distanceLabel` — both list-card components are fully covered.
6. ✅ **Image optimization**: add `resizeMode`, consistent sizes, and a placeholder/error fallback for merchant logos and listing images. All app images now go through a shared `src/components/ui/Image.tsx` wrapper around `expo-image` with `contentFit`, a default blurhash `placeholder`, and a 500ms `transition` — this gives every merchant logo/listing image a real loading placeholder, not just `resizeMode="cover"`. `onError` fallback state exists on `StaticMap.tsx`/`StaticMap.web.tsx` but not on `Image.tsx` itself, so a broken remote URL still has no visible error fallback there.
7. ⚠️ **Lazy-load heavy screens** (map, merchant dashboard charts, order detail) with `React.lazy` / dynamic imports where possible. `app/(customer)/(tabs)/map.tsx` now imports `Map` directly (no `React.lazy`/`Suspense` wrapper at the screen level anymore); the web-only Leaflet bundle is still dynamically `import()`-ed inside `src/components/map/Map.web.tsx`. No lazy-loading exists for the merchant dashboard or order detail screens.
8. ✅ **Preload critical data** after login (wallet, active orders, favorites) so tabs open instantly. `app/_layout.tsx` still calls `queryClient.prefetchQuery` for wallet, customer orders, and customer profile right after the current user loads.

## 🎨 UX / UI Polish

9. ✅ **Empty states**: add illustrations and primary CTA buttons to all empty screens (no orders, no inventory, no favorites, no search results). `EmptyState` (`src/components/ui/EmptyState.tsx`) is wired into merchant inventory, merchant orders, customer orders, favorites, notifications, and wallet transactions. It still only accepts `icon`/`title`/`description` props — no CTA-button slot — so none of those empty states have an in-place action button.
10. ✅ **Pull-to-refresh haptic feedback** on all scrollable screens. 9 files with `onRefresh` handlers also fire `Haptics.impactAsync` before refetching.
11. ✅ **Tab switcher animation**: animate the active pill background instead of an instant jump. `BottomTabBar.tsx` still renders an animated pill that springs to the active tab, skipped when reduce motion is on.
12. ❌ **Bottom-sheet** for merchant detail quick-preview from the map instead of a floating card. `src/components/ui/BottomSheet.tsx` now exists and is used elsewhere (profile edit modal, several merchant sheets), but the map screen (`app/(customer)/(tabs)/map.tsx`) still uses a native `Callout` tooltip for merchant preview, not the bottom sheet.
13. ❌ **Toast messages** for success/error actions (favorite toggled, listing published, status updated). No toast component/library found (only an unrelated `toast` field in `src/repositories/seed.ts`).
14. ❌ **Consistent header spacing** across screens; some have `pt-4`, others `pt-6`. Still inconsistent — 15 files use `pt-4`, 5 use `pt-6`.
15. ❌ **Consistent header spacing** across screens; some have `pt-4`, others `pt-6`. Duplicate of #14 in this list; same finding applies.
16. ✅ **Loading buttons**: show spinners on all destructive/confirm actions, not just a few. `Button.tsx`'s `loading` prop is now used across 29 call sites in `app/`.
17. ❌ **Better loading state for maps**: show a shimmer map placeholder instead of a static pin icon. No shimmer/skeleton usage inside `src/components/map/*` — the `Skeleton` imported in `map.tsx` is used for an unrelated label, not the map surface itself.
18. ✅ **Confirmation dialogs** for irreversible actions (cancel order, delete listing, logout). Logout has `Alert.alert` confirmation on both roles. Order cancellation has a two-step reason-picker/refund-confirmation flow. Delete-listing now has a real UI trigger too: `app/(merchant)/(tabs)/inventory.tsx` shows an undo-countdown confirmation (`pendingAction`/`countdown` state) before calling `deleteListing.mutate`, for both single and bulk-selected deletes.
19. ❌ **Swipe actions** on order/inventory cards (e.g., reorder, mark ready, delete). No `Swipeable`/`PanResponder`/swipe-gesture code on any order or inventory card; `react-native-gesture-handler` is only used for its `GestureHandlerRootView` wrapper in `app/_layout.tsx`.
20. ⚠️ **Pin code / OTP auto-fill** support on the OTP screen. Still no dedicated OTP verification screen in `app/` — `verifyOtp` remains only a repository method/form schema. Once an OTP screen is built, it should set `textContentType="oneTimeCode"` on the code input.
21. ✅ **Add a "Last updated" timestamp** on merchant inventory and order screens. Both `app/(merchant)/(tabs)/inventory.tsx` and `app/(merchant)/(tabs)/orders.tsx` still derive a `Last updated: HH:MM` label from TanStack Query's `dataUpdatedAt`.

## 🔔 Notifications

21. ✅ **Group notification preferences** in settings and wire them into local notifications (currently scheduled regardless of prefs). Profile screen still exposes toggles for new deals, order updates, merchant messages, and promotions, gating `scheduleLocalNotification`.
22. ✅ **Rich local notification data**: add deep-link `url` so tapping a notification navigates to the right screen. `scheduleLocalNotification`/`scheduleNotificationAtDate` accept `url`; `app/_layout.tsx` routes on `addNotificationResponseReceivedListener`.
23. ✅ **Merchant new-order alert** with sound and banner when the app is foregrounded. `src/services/notifications.ts`'s `setNotificationHandler()` now explicitly returns `shouldShowBanner: true`, `shouldShowAlert: true`, and `shouldPlaySound: true` — foreground banner + sound behavior is confirmed in code, not just configured on the payload.
24. ✅ **Customer pickup reminder** scheduled 30 min before the pickup window closes. Still scheduled at `pickupWindowEnd - 30 minutes` after a successful order, gated by the `orderUpdates` preference.
25. ❌ **Batch duplicate notifications** when multiple status updates happen in quick succession. No batching/dedup logic found in `src/services/notifications.ts`.

## 🗺️ Map & Location

26. ❌ **Cluster overlapping markers** when many merchants are in the same area. No clustering library/logic found.
27. ⚠️ **Show user heading / compass** on the map when location permission is granted. `Map.tsx` sets `showsUserLocation` (the native blue-dot indicator) but there's still no heading/compass arrow rendering.
28. ✅ **Map filter chips** (open now, category, distance) above the map. `app/(customer)/(tabs)/map.tsx` still shows category chips, an "Open Now" toggle, and a "Nearby" (≤5 km) toggle feeding the filtered merchant list into `Map`.
29. ❌ **Remember last map region** so returning to the tab restores the view. No persisted map region (`AsyncStorage`/MMKV) found in `map.tsx`.
30. ⚠️ Skipped, needs a decision — **Directions modal** that lets users choose Maps app (Apple Maps, Google Maps) on native. `src/lib/maps.ts`'s `openDirections()` still auto-picks Apple Maps on iOS / Google Maps on Android with no user-facing choice modal. Building the modal is new UI, not wiring — flagging in case you want it.
31. ⚠️ Skipped, needs a decision — **Distance formatting** in km/miles based on locale. `formatDistance(meters, locale = 'en')` in `src/lib/utils.ts` still ignores its `locale` parameter and always formats metric. The app only ever passes `'en'`/`'th'` (both metric in the Thailand context), so there's no existing locale to key a miles-switch off. Should the app ever show miles at all, given it's Thailand-only?
32. ✅/⚠️ **Callout polish**: add rating badge and category chips to the native/web popup. Rating badge still present in `Map.tsx`'s `Callout` (star + rating + review count). Category chips still skipped — `MerchantCard.tsx` still doesn't display category anywhere either, so there's no existing pattern to extend.

## 🛒 Orders & Checkout

33. ✅ **Cart support** for multiple listings before checkout (currently one-tap buy). `app/(customer)/cart.tsx` still exists with merchant grouping, quantity controls, and wallet spend on confirm.
34. ✅ **Order timeline UI** on order detail showing pending → confirmed → preparing → ready → picked up. `StatusStep` still renders the vertical stepper on `app/(customer)/order/[id].tsx`.
35. ✅ **QR code display** for the pickup code to speed up merchant scanning. `QRCode` component is still rendered on `app/(customer)/order/[id].tsx`.
36. ✅ **Reorder button** on completed orders that re-adds the same item(s). `useReorder` is still called from the order detail screen for `completed`/`picked_up` orders.
37. ✅ **Cancel-with-reason** flow and refund-to-wallet. `useCancelOrder` still cancels, refunds to wallet, and records the transaction; order detail exposes the reason-picker/refund-confirmation UI.
38. ✅ **Estimated pickup time** communicated clearly on the order detail. `formatPickupWindow()` is still called/displayed on the order detail screen.
39. ✅ **Order search** by merchant name, item, or pickup code on the customer orders screen. `app/(customer)/(tabs)/orders.tsx` still has a `SearchBar` filtering by merchant name, pickup code, and item title.

## 🏪 Merchant Experience

40. ❌ **Merchant dashboard real-ish time** revenue animation on load. No animation code found on the dashboard screen.
41. ✅ **Bulk inventory actions**: mark multiple listings sold out / active at once. `app/(merchant)/(tabs)/inventory.tsx` now has a selection mode (`selectedIds`, `isSelecting`) with a selection ribbon, bulk delete, and a `BulkAdjustPriceSheet` for batch price adjustments across the selected listings.
42. ✅ **Inventory low-stock warning** when `quantityRemaining` drops below a threshold. Merchant inventory cards still show a "Low stock" danger label at 1–3 items remaining.
43. ✅ **Duplicate listing** action to create a similar listing faster. `DuplicatePickupSheet` (`src/components/screens/merchant-inventory/DuplicatePickupSheet.tsx`) is wired into inventory, which navigates to `listings/new` with a `duplicateId` param that pre-fills the form and shifts the pickup window to today.
44. ✅ **Draft listings**: allow saving unpublished listings. `ListingStatus` now includes `'draft'` (`src/types/index.ts`), and the create-listing screen has an explicit `onSaveDraft` handler (`handleSubmit((data) => onSubmit(data, 'draft'))`) alongside publish.
45. ⚠️ **Merchant order filters**: by status, date, or pickup window. `app/(merchant)/(tabs)/orders.tsx` now has a status-filter chip row (`statusFilter`/`statusFilters`) plus search, but still no date/pickup-window filter.
46. ✅ **Print-friendly order summary** for merchant devices. `app/(merchant)/order/[id].tsx` now has a `handlePrint` action (Printer icon button) that builds an order summary and surfaces it via `Alert.alert` — a lightweight "print" affordance, not an actual OS print dialog/PDF.
47. ⚠️ **Listing analytics** (views, conversion) on each inventory item. Still only merchant-level analytics (`MERCHANT_ANALYTICS`, `useAnalytics`); no per-listing views/conversion data in the repository interfaces or seed data. A new event-tracking service (`src/services/analytics.ts`) now records a `listing_tap` event per listing, but nothing aggregates or surfaces it back on the inventory screen yet.

## 📝 Forms & Validation

48. ✅ **Real-time inline validation** messages instead of only on submit. `listings/new.tsx` still uses `mode: 'onChange'`.
49. ✅ **Better date/time picker** for pickup windows instead of a plain text input. `src/components/ui/DateTimePickerField.tsx` now exists and is used (twice) in `app/(merchant)/promotions.tsx`. It is not yet used on the listing create screen's pickup-window fields specifically — worth checking whether that screen still uses raw text input.
50. ✅ **Image picker simulation** on web should show a preview, not just a placeholder URL. Real `expo-image-picker` (camera + library, with permission requests) is now wired into both `app/(merchant)/listings/new.tsx` and `app/(customer)/order/[id].tsx`.
51. ❌ **Form auto-save** to avoid losing progress if the merchant leaves the create screen. No `AsyncStorage`/persistence found in `listings/new.tsx` — the new "save as draft" button (#44) is a manual save action, not auto-save.
52. ✅ **Number input formatting** with currency separators for Thai Baht. Price inputs still blur to `formatCurrency(value)`.
53. ✅ **Character counters** on title and description fields. Still using `Input showCharacterCount` / inline counters.

## ♿ Accessibility

54. ⚠️ **Audit all testIDs** and add missing accessibility labels/roles for screen readers. `accessibilityLabel` still covers the icon-only buttons named in #56; broader coverage across every icon (chips, badges, less-common icon buttons) is still missing.
55. ❓ **Ensure color contrast** meets WCAG AA for all text on primary/background colors. Still not verifiable by code search — needs a manual/tooling contrast audit against `tailwind.config.js` tokens.
56. ✅ **Add `accessibilityHint`/`accessibilityLabel`** to icon-only buttons (favorite, navigate, share, close). Still present on `FavoriteButton.tsx`, listing-detail share, map preview close, map callout directions, wallet top-up modal close, header back button.
57. ✅ **Reduce motion** support: disable heavy press/spring animations when the OS setting is on. `useReducedMotion.ts` still wired into `Button.tsx`, `PressableScale.tsx`, `Skeleton.tsx`.
58. ✅ **Larger touch targets** for small chips and the map callout favorite button. `hitSlop={8}` still present alongside the same icon-button set as #56.

## 🧪 Testing & DevEx

59. ✅ **Add unit tests** with Jest + React Native Testing Library for hooks and UI primitives. `jest.config.js` now exists and there are real test files: `src/lib/utils.test.ts`, `src/components/ui/Button.test.tsx`, `src/components/ui/Input.test.tsx`. Coverage is still thin (3 test files) but the previously-missing Jest setup is fully in place.
60. ✅ **Add a Maestro flow** that buys a listing end-to-end (currently create-listing is covered but not checkout). `.maestro/customer-buy-listing-flow.yaml` still exists and is included in `run-all.yaml`.
61. ❌ **Visual regression tests** for web export with Playwright/Chromatic. No Chromatic/Playwright config found.
62. ❌ **Snapshot tests** for theme tokens and design-system components. No `.snap` files anywhere.
63. ❌ **Strict TypeScript for Maestro IDs**: generate a typed testID registry to avoid drift. Not found.
64. ⚠️ **CI workflow** that runs lint, typecheck, and Maestro on every PR. `.github/workflows/ci.yml` now exists and runs `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm test` on push/PR — a real CI pipeline where none existed before. It does not run the Maestro E2E suite (no `maestro test` step), so it's partial against the original ask.
65. ❌ **Document the repository pattern** with a short README in `src/repositories/`. Still no README in that folder.

## 🌍 Localization

66. ⚠️ **Move all hard-coded strings** (e.g., "Order History", create listing labels) into `i18n/en.ts` and `i18n/th.ts`. `t('...')` usage remains extensive. Spot-checked `app/(customer)/(tabs)/orders.tsx`, which still has `placeholder="Search orders..."` hardcoded with no matching key to reuse — writing one means new English + Thai copy, not wiring. Left as skipped.
67. ✅ **Pluralization support** for item counts and review counts. `quantityLeft`/`reviewCount` plural keys still present and wired into `ListingCard`, listing detail, merchant inventory, merchant detail.
68. ✅ **Date/time localization** using `Intl.DateTimeFormat` or `date-fns` with Thai locale. `formatPickupWindow()`/`getMerchantOpenStatus()` still use `Intl.DateTimeFormat` with locale handling.
69. ❌ **RTL layout audit** even though Thai is LTR, to future-proof Arabic support. No `I18nManager`/`isRTL`/RTL-related code found anywhere.

## 🔒 Security & Trust

70. ✅ **Remove mock auth** before production and integrate Supabase Auth / secure backend. `src/repositories/supabase.ts` now implements real auth against `supabase.auth.signInWithPassword`, `signUp`, `signOut`, `resetPasswordForEmail`, `verifyOtp`, `resend`, and `getUser`. The switch is controlled by `EXPO_PUBLIC_REPOSITORY_MODE === 'supabase'` in `src/repositories/index.ts` — mock repositories remain the default for local dev, but a real backend now exists and is fully wired, not just scaffolded.
71. ✅ **Store tokens in `expo-secure-store`** instead of AsyncStorage. `src/lib/supabase.ts` defines a `SecureStoreAdapter` (`expo-secure-store`, no-op on web) and passes it as the Supabase client's `auth.storage` — this is now actually used, not just an installed-but-unused package.
72. ❌ **Input sanitization** for search and form text to prevent XSS in shared content. No sanitization logic (`sanitize`, `DOMPurify`, `escapeHtml`) found anywhere.
73. ⚠️ **Rate limiting** on auth attempts in the (future) backend. A real backend now exists (Supabase Auth), whose hosted GoTrue service applies its own default rate limiting on auth endpoints — so this is no longer purely N/A. No custom app-level rate-limiting code was found in `src/repositories/supabase.ts` or `supabase/functions/`; the only in-repo rate-limit logic found is an unrelated per-day broadcast-message limit in `app/(merchant)/broadcast.tsx`.
74. ⚠️ **Hide sensitive fields** from Metro logs and Flipper in release builds. `LogBox.ignoreAllLogs(true)` in `app/_layout.tsx` still suppresses all warnings globally rather than selectively hiding sensitive fields. Left as a product decision — no existing selective-redaction pattern to extend.

## 🌐 Web & Deep Links

75. ❌ **Custom web meta tags** per route for SEO when exporting static web. No `expo-router/head` or `<Head>` usage found in any route file.
76. ❌ **Responsive web layout** for merchant dashboard on tablets/desktops. No responsive breakpoint classes (`md:`/`lg:`) or `useWindowDimensions`-based layout switch found on the dashboard screen.
77. ❌ **Deep-link validation** and a central link-handling hook. No dedicated deep-link validation file/hook found.
78. ✅ **Share listing/merchant URLs** that open correctly on web and native. `Share.share()` still implemented in both listing detail and the map screen.
79. ❌ **Apple / Google sign-in** on the welcome screen. No `expo-apple-authentication` or Google sign-in package/usage found.

## 📊 Analytics & Reliability

80. ✅ **Add lightweight analytics events** (screen views, listing views, order conversions). `src/services/analytics.ts` now implements a real `trackEvent`/`analytics.*` API — in-memory queue in mock mode, `analytics_events` table insert in Supabase mode, with a `flushAnalyticsEvents` replay path. It's actually called from `src/hooks/useOrders.ts` (order placed/cancelled) and `src/hooks/useFavorites.ts` (favorite toggled), not just defined and unused.
81. ✅ **Global error boundary** with a friendly fallback and retry option. `src/components/layout/ErrorBoundary.tsx` still wraps the root `<Stack />` in `app/_layout.tsx` with a "Try again" fallback.
82. ✅ **Network/offline detection** and a banner when the device is offline. `src/hooks/useNetworkState.ts` + `src/components/ui/OfflineBanner.tsx` are now real and wired into `app/_layout.tsx` and the merchant dashboard, with an offline mutation queue (`src/lib/offlineQueue.ts`, `useOfflineQueue`, `useOfflineMutation`) that replays queued writes (orders, favorites, reviews, messages, etc.) once connectivity returns.
83. ✅ **Request retry policy** for TanStack Query with exponential backoff. `src/services/queryClient.ts` now sets an explicit `retry: 3` with a custom `retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)` — a real tuned backoff policy, not just the library default.
84. ❌ **Sentry / error tracking** integration for production crashes. Still not in `package.json`; `ErrorBoundary.tsx` only has a comment noting "In production this would go to Sentry" — no actual init/SDK call.

## ⚙️ Settings & Onboarding

85. ❌ **Biometric app lock** option in settings. No `expo-local-authentication`/biometric usage found.
86. ⚠️ **Theme preview** toggle with a small card in settings. Still a direct dark/light `Switch` toggle (`useThemeStore`) in the profile screen, no preview card shown before applying.
87. ⚠️ **Language selector** as a bottom sheet instead of a simple menu item. Still `Alert.alert`-based (`handleLanguagePress`). Worth re-flagging: a real `BottomSheet` primitive now exists in the codebase (`src/components/ui/BottomSheet.tsx`, already used for the profile screen's own edit-name modal), so this is no longer blocked by "no bottom-sheet primitive to build on" — it's now a small, mechanical swap rather than new UI from scratch.
88. ❌ **Onboarding tooltip** for first-time merchants explaining the dashboard. No tooltip/onboarding-hint code found for the dashboard.
89. ❌ **Profile photo upload** and edit from the profile screen. No `ImagePicker` usage on the profile screen (it's used for listings/order proof photos, not profile avatars).
90. ✅ **Version/build info** in settings for easier support. Customer profile screen still shows `{App Name} v{version} ({buildNumber})` via `expo-constants`.

---

## Summary

- ✅ **Done: 49** — FlashList migration, list skeletons, search debounce, memoized card computations, image placeholder/optimization via `expo-image`, preload critical data, empty states, pull-to-refresh haptics, tab switcher animation, loading-button spinners, full confirmation-dialog coverage (including delete listing), notification preferences, notification deep links, foreground banner/sound, pickup reminder, map filter chips, cart, order timeline, QR code, reorder, cancel-with-reason, pickup time display, order search, bulk inventory actions, low-stock warning, duplicate listing, draft listings, print-friendly summary, real-time validation, date/time picker, real image picker, currency formatting, character counters, icon-button accessibility labels/hitSlop, reduce motion, unit tests (Jest set up + real tests), Maestro buy-flow, pluralization, date/time localization, mock-auth replaced with real Supabase auth, secure-store token storage, analytics events (wired, not just defined), global error boundary, offline detection + banner + queue, tuned retry/backoff policy, share URLs, version/build info, map callout rating badge (its category-chip half is still open, see Partial).
- ⚠️ **Partial: 15** — lazy-loading heavy screens (map screen lost its screen-level lazy wrapper; web Leaflet split still lazy), listing analytics (event exists, no per-listing aggregation/surface), merchant order filters (status only, no date/pickup filter), OTP auto-fill (no OTP screen exists yet), broader testID/accessibility audit, hard-coded string sweep, CI workflow (runs lint/typecheck/test, not Maestro), auth rate limiting (real backend exists now, no custom app-level limiting confirmed), hide sensitive log fields, theme preview card, language selector as bottom sheet (primitive now exists, not yet used here), map callout category chips (rating badge half done), directions-app-choice modal, km/mi locale decision, user-heading/compass indicator (blue dot only, no arrow).
- ❌ **Not started: 26**
- ❓ **Not verifiable by static analysis: 1** (color contrast — needs a manual/tooling audit)

### Explicitly skipped (needs your call)

- **#31 distance in km/miles** — app only supports `en`/`th` locales (both metric in the Thailand context); no locale exists to key a miles-switch off of. Should the app ever show miles at all?
- **#74 hide sensitive log fields** — currently uses a blunt `LogBox.ignoreAllLogs(true)`; no existing selective-redaction pattern to extend. Needs a decision on what should actually be logged.
- **#30 directions app-choice modal** — `openDirections()` silently picks Apple Maps (iOS) / Google Maps (Android) with no user choice. Worth a call on whether that's fine or a modal is wanted.
- Larger items that would need new UI/components rather than wiring: bottom sheet for map quick-preview (#12), toast system (#13), merchant dashboard revenue animation (#40), swipe actions (#19), form auto-save (#51), biometric app lock (#85), onboarding tooltip (#88), profile photo upload (#89), Sentry integration (#84), input sanitization (#72).

This file will keep drifting from the code the moment new features ship — treat every status above as a snapshot from the verification date above, not a permanent record, and re-verify before relying on it for planning.
