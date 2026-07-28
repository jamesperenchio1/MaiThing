# Maithing Quality-of-Life Improvements

A running list of small-to-medium improvements that would make the app feel more polished, reliable, and delightful. Items are grouped by area and roughly ordered by impact vs. effort.

**Status legend:** ✅ Done · ⚠️ Partial (something exists but isn't complete/wired up) · ❌ Not started
**Last verified:** 2026-07-28, against the codebase directly (grep/read, not assumed). A wiring pass on 2026-07-28 connected several partial items — see the changed rows below and the summary at the bottom for what was intentionally skipped and why.

## 🚀 Performance & Lists

1. ❌ **Replace `ScrollView` + `.map()` with `FlashList`** on long screens (orders, inventory, discover, merchant listings) to eliminate scroll jank and memory spikes. No `FlashList` import anywhere in the repo; 9 screens still use `ScrollView`.
2. ✅ **Add list skeletons** that match the exact card layout instead of generic placeholders. Now wired into merchant inventory, merchant orders, customer orders, notifications, and wallet transactions (in addition to the 4 screens that already had it), each sized to approximate its card's height instead of showing plain "Loading..." text.
3. ❌ **Paginate or virtualize** order history, wallet transactions, and merchant order lists once data grows. No `FlatList`, `pageSize`, or pagination logic found.
4. ✅ **Debounce search inputs** (e.g., discover search, map search) to ~300 ms to avoid a query/re-render on every keystroke. Implemented in `app/(customer)/(tabs)/discover.tsx` via a `debouncedQuery` state.
5. ⚠️ **Memoize heavy computations** (`calculateDistance`, `getMerchantOpenStatus`, filtered lists) with `useMemo`. `MerchantCard.tsx`'s `getMerchantOpenStatus` call (invoked once per card in every merchant list) is now wrapped in `useMemo`. The other call sites for `calculateDistance`/`getMerchantOpenStatus` are single-item detail screens, not list renders, so they weren't in scope for this fix.
6. ⚠️ **Image optimization**: add `resizeMode`, consistent sizes, and a placeholder/error fallback for merchant logos and listing images. `resizeMode="cover"` is now applied to every `<Image>` in the app (5 previously-missing spots fixed: listing image picker preview, both order-item thumbnails, customer order card logo, `MerchantCard` logo). No error/placeholder fallback exists anywhere in the codebase (not even in the screens that already had `resizeMode`) — adding that requires new `onError` state/fallback-asset logic, which is new behavior, not wiring, so it was left alone.
7. ❌ **Lazy-load heavy screens** (map, merchant dashboard charts, order detail) with `React.lazy` / dynamic imports where possible. No `React.lazy` usage found.
8. ❌ **Preload critical data** after login (wallet, active orders, favorites) so tabs open instantly. No `prefetchQuery` or preload logic found.

## 🎨 UX / UI Polish

9. ✅ **Empty states**: add illustrations and primary CTA buttons to all empty screens (no orders, no inventory, no favorites, no search results). `EmptyState` is now wired into merchant inventory, merchant orders, customer orders (including the "no search results" case), favorites, notifications, and wallet transactions — no longer dead code. Note: it doesn't have a CTA-button slot, only icon/title/description, so screens still don't have an action button in the empty state itself (e.g. no "Create your first listing" button inside the empty state on inventory) — that would mean extending the component's API, which is new, not wiring.
10. ✅ **Pull-to-refresh haptic feedback** on all scrollable screens. All 9 `onRefresh` handlers (inventory, discover, favorites, merchant dashboard, customer home, wallet, merchant orders, customer orders, notifications) now fire `Haptics.impactAsync(Light)` before refetching, using the same pattern already established elsewhere in the app.
11. ❌ **Tab switcher animation**: animate the active pill background instead of an instant jump. No `Animated`/`useAnimatedStyle` usage in `src/components/navigation`.
12. ❌ **Bottom-sheet** for merchant detail quick-preview from the map instead of a floating card. Map currently uses a native `Callout` tooltip, not a bottom sheet.
13. ❌ **Toast messages** for success/error actions (favorite toggled, listing published, status updated). No toast component or library anywhere in the repo.
14. ❌ **Consistent header spacing** across screens; some have `pt-4`, others `pt-6`. Still inconsistent — 15 files mix both.
15. ⚠️ **Loading buttons**: show spinners on all destructive/confirm actions, not just a few. `Button.tsx` supports a `loading` prop and it's used in 8 places; not confirmed as covering every destructive/confirm action (e.g., order cancel has no UI action at all — see #37). Left as-is: auditing "every" destructive action would mean deciding which untouched actions need a `loading` state, which is a design call, not mechanical wiring.
16. ❌ **Better loading state for maps**: show a shimmer map placeholder instead of a static pin icon. No shimmer usage found in map components.
17. ⚠️ **Confirmation dialogs** for irreversible actions (cancel order, delete listing, logout). Logout already has `Alert.alert` confirmation on both customer and merchant screens — that part of this item was already done, not partial. Delete-listing has a repository method but no UI trigger at all, so there's nothing to add a confirmation to without building the delete action itself. Order cancellation still has no confirmation dialog because there's no cancel action UI at all (see #37). Left as-is — both remaining gaps require new UI, not wiring.
18. ❌ **Swipe actions** on order/inventory cards (e.g., reorder, mark ready, delete). No `Swipeable` or swipe-gesture code found.
19. ❌ **Pin code / OTP auto-fill** support on the OTP screen. No `textContentType="oneTimeCode"` or equivalent found.
20. ❌ **Add a "Last updated" timestamp** on merchant inventory and order screens. No such text found.

## 🔔 Notifications

21. ❌ **Group notification preferences** in settings and wire them into local notifications (currently scheduled regardless of prefs). No wiring found between prefs and the notification scheduler in `src/services`.
22. ❌ **Rich local notification data**: add deep-link `url` so tapping a notification navigates to the right screen. No `url` field passed when scheduling notifications.
23. ⚠️ **Merchant new-order alert** with sound and banner when the app is foregrounded. `sound: 'default'` is configured in `src/services/notifications.ts`; foreground banner behavior not confirmed.
24. ❌ **Customer pickup reminder** scheduled 15/30 min before the pickup window closes. No reminder-scheduling logic found.
25. ❌ **Batch duplicate notifications** when multiple status updates happen in quick succession. No batching logic found.

## 🗺️ Map & Location

26. ❌ **Cluster overlapping markers** when many merchants are in the same area. No clustering library/logic found.
27. ❌ **Show user heading / compass** on the map when location permission is granted. No heading/compass code found.
28. ❌ **Map filter chips** (open now, category, distance) above the map. Not found on the map screen.
29. ❌ **Remember last map region** so returning to the tab restores the view. No persistence of map region found.
30. ⚠️ **Directions modal** that lets users choose Maps app (Apple Maps, Google Maps) on native. `src/lib/maps.ts` auto-picks Apple Maps on iOS / Google Maps on Android by platform — there's no user-facing choice modal, it just opens one app. Skipped — building the modal is new UI, not wiring.
31. ⚠️ Skipped, needs a decision — **Distance formatting** in km/miles based on locale. `formatDistance()` still ignores its `locale` param. The app only ever passes `'en'` or `'th'` (the two supported languages, both metric in the Thailand context) — there's no `'en-US'` or similar locale anywhere in the app's language store to key a miles-switch off of. Making this real would mean inventing a new "which locales get miles" rule the app doesn't otherwise have, which is a product decision, not mechanical wiring. Flagging for you to decide: should the app ever show miles at all, given it's Thailand-only?
32. ✅/⚠️ **Callout polish**: add rating badge and category chips to the native/web popup. Rating badge added — `src/components/map/Map.tsx`'s `Callout` now shows a star + rating + review count using the exact pattern already established in `MerchantCard.tsx` and the existing `Merchant.rating`/`reviewCount` fields. Category chips still skipped: `MerchantCard.tsx` (the reference component) doesn't display category anywhere either, so there was no existing pattern to reuse — adding one would mean designing new chip styling from scratch.

## 🛒 Orders & Checkout

33. ⚠️ **Cart support** for multiple listings before checkout (currently one-tap buy). `useCartStore` (Zustand) fully implements add/remove/update-quantity/subtotal logic, but it's only referenced from the single listing detail screen and there's **no checkout screen** that consumes a multi-item cart — end-to-end it's still effectively one-tap buy. Skipped — there's no existing checkout screen to wire the cart into; building one is new UI/flow, not wiring.
34. ❌ **Order timeline UI** on order detail showing pending → confirmed → preparing → ready → picked up. The status list exists as a plain data array (`activeStatuses`) but no visual stepper/timeline component was found.
35. ✅ **QR code display** for the pickup code to speed up merchant scanning. `qrcode-generator` is installed, `src/components/ui/QRCode.tsx` is built, and it's rendered on the customer order detail screen (`app/(customer)/order/[id].tsx`).
36. ❌ **Reorder button** on completed orders that re-adds the same item(s). No "reorder" logic found.
37. ⚠️ **Cancel-with-reason** flow and refund-to-wallet. A `refund()` method exists in the repository/wallet layer (`src/repositories/mock.ts`, `interfaces.ts`), but there's no cancel button or reason-capture UI anywhere in the order detail screen — the backend piece exists, the user-facing flow doesn't. Skipped — there's no cancel button to attach a reason-picker to; building both is new UI, not wiring.
38. ✅ **Estimated pickup time** communicated clearly on the order detail. `formatPickupWindow()` is called and displayed on `app/(customer)/order/[id].tsx`.
39. ✅ **Order search** by merchant name, item, or pickup code on the customer orders screen. Implemented in `app/(customer)/(tabs)/orders.tsx` with a `SearchBar` filtering by merchant name, pickup code, and item title.

## 🏪 Merchant Experience

40. ❌ **Merchant dashboard real-ish time** revenue animation on load. No animation code found on the dashboard screen.
41. ❌ **Bulk inventory actions**: mark multiple listings sold out / active at once. No multi-select/bulk-action code found.
42. ❌ **Inventory low-stock warning** when `quantityRemaining` drops below a threshold. No such threshold check found anywhere.
43. ❌ **Duplicate listing** action to create a similar listing faster. No "duplicate" logic found.
44. ❌ **Draft listings**: allow saving unpublished listings. No draft status/field found in the listing schema or repository.
45. ❌ **Merchant order filters**: by status, date, or pickup window. The merchant orders screen only has per-order "advance to next status" actions — no filter UI.
46. ❌ **Print-friendly order summary** for merchant devices. No print-related code found.
47. ⚠️ **Listing analytics** (views, conversion) on each inventory item. Merchant-level analytics exist (`MERCHANT_ANALYTICS` mock data, `useAnalytics` hook), but nothing confirmed at the individual-listing level for views/conversion. Skipped — there's no per-listing view/conversion data anywhere to wire up; the mock data would need to be invented from scratch, which is new, not wiring.

## 📝 Forms & Validation

48. ❌ **Real-time inline validation** messages instead of only on submit. No `onChange`/`onBlur` validation mode configured on any form.
49. ❌ **Better date/time picker** for pickup windows instead of a plain text input. No `DateTimePicker` component found.
50. ❌ **Image picker simulation** on web should show a preview, not just a placeholder URL. No `expo-image-picker` usage found at all — listing images are still placeholder URLs.
51. ❌ **Form auto-save** to avoid losing progress if the merchant leaves the create screen. No persistence found in `listings/new.tsx`.
52. ❌ **Number input formatting** with currency separators for Thai Baht. `formatCurrency()` exists for display elsewhere but isn't wired into the create-listing price inputs.
53. ❌ **Character counters** on title and description fields. Not found in `listings/new.tsx`.

## ♿ Accessibility

54. ⚠️ **Audit all testIDs** and add missing accessibility labels/roles for screen readers. `accessibilityLabel` is now added to the icon-only buttons named in #56 (favorite, share, navigate/directions, close, header back, quantity +/-). Broader coverage across every icon in the app (chips, badges, less-common icon buttons) is still missing — a full "audit all" pass would mean touching many more files and making labeling judgment calls per icon, so this is upgraded to partial rather than done.
55. ❓ **Ensure color contrast** meets WCAG AA for all text on primary/background colors. Not verifiable by code search — needs a manual/tooling contrast audit against `tailwind.config.js` tokens.
56. ✅ **Add `accessibilityHint`/`accessibilityLabel`** to icon-only buttons (favorite, navigate, share, close). Added to: `FavoriteButton.tsx` (shared component, so this fixes every screen that uses it — listing detail, map callout, map preview card), the listing-detail share button, the map preview close button, the map callout directions button, the wallet top-up modal close button, and the header back button.
57. ❌ **Reduce motion** support: disable haptics and heavy animations when the OS setting is on. No `AccessibilityInfo`/`isReduceMotionEnabled` usage found.
58. ✅ **Larger touch targets** for small chips and the map callout favorite button. `hitSlop={8}` added alongside every `accessibilityLabel` change above (favorite button, share, close buttons, directions button, quantity +/-, header back). Chips elsewhere in the app weren't touched — no chip component was in the originally-flagged icon-button list.

## 🧪 Testing & DevEx

59. ❌ **Add unit tests** with Jest + React Native Testing Library for hooks and UI primitives. No Jest config exists; `AGENTS.md` itself confirms this.
60. ❌ **Add a Maestro flow** that buys a listing end-to-end (currently create-listing is covered but not checkout). No checkout/buy flow file in `.maestro/`.
61. ❌ **Visual regression tests** for web export with Playwright/Chromatic. No Chromatic config found.
62. ❌ **Snapshot tests** for theme tokens and design-system components. No `.snap` files anywhere.
63. ❌ **Strict TypeScript for Maestro IDs**: generate a typed testID registry to avoid drift. Not found.
64. ❌ **CI workflow** that runs lint, typecheck, and Maestro on every PR. No `.github/workflows` directory.
65. ❌ **Document the repository pattern** with a short README in `src/repositories/`. No README in that folder.

## 🌍 Localization

66. ⚠️ **Move all hard-coded strings** (e.g., "Order History", create listing labels) into `i18n/en.ts` and `i18n/th.ts`. 147 `t('...')` calls exist showing solid i18n adoption already. Checked `i18n/en.ts` for the specific strings still hardcoded (e.g. "My Orders", "Order History", "Search orders...", "No results found") — none of them have an existing matching key sitting unused, so wiring them in would mean writing brand-new English *and* Thai copy, which is new content, not wiring. Skipped.
67. ❌ **Pluralization support** for item counts and review counts. No plural-handling logic found in `src/i18n`.
68. ✅ **Date/time localization** using `Intl.DateTimeFormat` or `date-fns` with Thai locale. `formatPickupWindow()` and `getMerchantOpenStatus()` in `src/lib/utils.ts` both use `Intl.DateTimeFormat` with a `locale` param and explicit Thai (`'th'`) handling.
69. ❌ **RTL layout audit** even though Thai is LTR, to future-proof Arabic support. No evidence of any RTL-related code or audit.

## 🔒 Security & Trust

70. ❌ **Remove mock auth** before production and integrate Supabase Auth / secure backend. Still fully mock — no live Supabase client wired into any repository.
71. ❌ **Store tokens in `expo-secure-store`** instead of AsyncStorage. Package is installed (`expo-secure-store` in `package.json`) but not actually used in `src/stores/auth.ts`.
72. ❌ **Input sanitization** for search and form text to prevent XSS in shared content. No sanitization logic found.
73. ❌ **Rate limiting** on auth attempts in the (future) backend. N/A currently — no real backend exists yet.
74. ⚠️ **Hide sensitive fields** from Metro logs and Flipper in release builds. The opposite blunt approach is in place: `LogBox.ignoreAllLogs(true)` in `app/_layout.tsx` suppresses *all* warnings globally rather than selectively hiding sensitive fields. Skipped intentionally — changing or removing `LogBox.ignoreAllLogs` is a behavior change with no clear "correct" replacement to wire in (there's nothing else in the codebase that already redacts sensitive fields to reuse), so this needs a product decision about what should actually be logged, not a mechanical fix.

## 🌐 Web & Deep Links

75. ❌ **Custom web meta tags** per route for SEO when exporting static web. No per-route `<Head>`/meta usage found.
76. ❌ **Responsive web layout** for merchant dashboard on tablets/desktops. No responsive breakpoint classes found on the dashboard screen.
77. ❌ **Deep-link validation** and a central link-handling hook. No dedicated deep-link file/hook found.
78. ✅ **Share listing/merchant URLs** that open correctly on web and native. `Share.share()` implemented in both `app/(customer)/listing/[id].tsx` and the map screen.
79. ❌ **Apple / Google sign-in** on the welcome screen. No `expo-apple-authentication` or Google sign-in package/usage found.

## 📊 Analytics & Reliability

80. ❌ **Add lightweight analytics events** (screen views, listing views, order conversions). Only merchant-facing mock analytics *data* exists (revenue/orders dashboard) — no event-tracking instrumentation.
81. ❌ **Global error boundary** with a friendly fallback and retry option. No `ErrorBoundary` component anywhere.
82. ❌ **Network/offline detection** and a banner when the device is offline. No `NetInfo` package or offline-handling code found.
83. ⚠️ **Request retry policy** for TanStack Query with exponential backoff. `retry: 1` is configured in `src/services/queryClient.ts`, which does use TanStack Query's built-in default exponential backoff. Left as-is — the backoff behavior described in the item is technically already active via the library default; picking specific custom `retryDelay`/`retry` values would be a tuning decision (how many retries, what backoff curve) rather than wiring up something that already exists elsewhere.
84. ❌ **Sentry / error tracking** integration for production crashes. Not in `package.json`, no Sentry init code.

## ⚙️ Settings & Onboarding

85. ❌ **Biometric app lock** option in settings. No `expo-local-authentication` usage found.
86. ⚠️ **Theme preview** toggle with a small card in settings. A dark/light toggle exists in the profile screen (`useThemeStore`), but there's no visual "preview card" shown before applying — it's a direct switch, not a preview. Skipped — a preview card is new UI with no existing pattern to reuse.
87. ⚠️ **Language selector** as a bottom sheet instead of a simple menu item. Language switching works, but via `Alert.alert` (a native action sheet), not a custom bottom sheet component. Skipped — there is no bottom-sheet primitive anywhere in the codebase to wire this into; building one would be new UI, not wiring.
88. ❌ **Onboarding tooltip** for first-time merchants explaining the dashboard. No tooltip/onboarding-hint code found.
89. ❌ **Profile photo upload** and edit from the profile screen. No `ImagePicker` usage on the profile screen.
90. ❌ **Version/build info** in settings for easier support. No `Constants.expoConfig`/version display found in any settings screen.

---

## Summary

- ✅ **Done: 11** — search debounce, QR pickup code, order search, pickup time display, distance/date `Intl` localization, share URLs, list skeletons, empty states, pull-to-refresh haptics, icon-button accessibility labels/hitSlop.
- ⚠️ **Partial: 17** — down from 26. Wiring pass on 2026-07-28 finished: list skeletons, empty states, pull-to-refresh haptics, icon-button a11y labels/hitSlop, image `resizeMode` coverage, `useMemo` on the one real list-render hotspot, and a rating badge on the map callout. The remaining 17 partials were deliberately left alone because completing them means building new UI/logic (a checkout screen, a cancel-with-reason modal, a bottom sheet, a directions-choice modal, new translation copy, etc.) rather than connecting something that already exists — see each item's note above for specifics.
- ❌ **Not started: 61**
- ❓ **Not verifiable by static analysis: 1** (color contrast — needs a manual/tooling audit)

### Explicitly skipped in the 2026-07-28 wiring pass (needs your call)

- **#31 distance in km/miles** — app only supports `en`/`th` locales (both metric in Thailand); no locale exists to key a miles-switch off of. Should the app ever show miles at all?
- **#74 hide sensitive log fields** — currently uses a blunt `LogBox.ignoreAllLogs(true)`; no existing selective-redaction pattern to extend. Needs a decision on what should actually be logged.
- Everything else skipped needed genuinely new UI or content (checkout screen, cancel-with-reason modal, bottom sheet component, directions-choice modal, category chips, new translation strings, per-listing analytics data) rather than a judgment call — those are listed under "Not started" territory in spirit even though they're technically partial.
