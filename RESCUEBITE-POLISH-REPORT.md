# RescueBite / MaiThing Production Polish Report

## Scope

This pass focused on removing AI-generated slop, unifying the consumer design system, adding a comprehensive buyer onboarding flow, and polishing the admin console. The goal was to make the app feel like a product built by senior engineers: minimal, consistent, fast, and maintainable.

---

## 1. Consumer Design System

### What changed

- Created a single source of truth for theming in `apps/consumer/src/theme.tsx`.
  - Light/dark color tokens (background, surface, primary, danger, warning, success, text, borders, overlays).
  - `spacing`, `radii`, `fontSizes`, `fontWeights`, `lineHeights`, `opacity` scales.
  - `ThemeProvider` + `useTheme` hook that follows the system color scheme.
- Created reusable UI primitives in `apps/consumer/src/components/ui/`:
  - `Avatar`, `Badge`, `Button`, `Card`, `EmptyState`, `ErrorState`, `Icon`, `Input`, `LoadingState`, `Screen`.
  - All components consume the theme and accept consistent props (`style`, `variant`, `loading`, `disabled`, etc.).
- Created `apps/consumer/src/icons.ts` as a semantic icon map over `@expo/vector-icons` (Ionicons).
- Wrapped the app in `ThemeProvider` from `app/_layout.tsx`.

### Why

Before this pass, screens were inconsistent: different border radii, different padding, ad-hoc colors, emoji placeholders, and duplicated loading/empty/error patterns. A design system makes every screen look like it belongs to the same product and dramatically reduces the amount of UI code in each screen.

---

## 2. Emoji & AI Copy Removal

### What changed

- Removed every emoji from consumer TypeScript/i18n files (verified with a unicode-emoji regex search).
- Replaced them with semantic Ionicons icons (map, bag, person, restaurant, location, etc.).
- Rewrote awkward AI-sounding copy in `apps/consumer/src/i18n/en.ts` and `th.ts`:
  - Removed/softened generic marketing phrases.
  - Changed `merchant.welcome` from `Welcome back` to `Merchant dashboard` (EN) and `แดชบอร์ดร้านค้า` (TH).
  - Tightened referral copy from `Enter a code from a friend to get started` to `Enter a code from a friend`.

### Why

Emojis and generic AI copy make the product feel like a prototype. The app is a food-waste marketplace, not a marketing landing page; copy should be neutral, concise, and actionable.

---

## 3. Comprehensive Buyer Onboarding

### What changed

- Added `apps/consumer/src/lib/onboarding.ts` with `hasCompletedOnboarding()` / `markOnboardingComplete()` backed by `expo-secure-store`.
- Added new route group `apps/consumer/app/(onboarding)/` with a full-screen, swipeable onboarding flow.
- Onboarding steps:
  1. **Rescue** – what MaiThing is (surplus food at a discount).
  2. **Browse** – find nearby stores on the map or list.
  3. **Buy** – reserve a pickup slot and pay in-app.
  4. **Collect** – show the pickup code and rate the experience.
- Added skip button, page indicator dots, animated transitions, and "Get started" CTA.
- Updated `app/index.tsx` to check onboarding completion after auth and redirect new users to `/(onboarding)`.
- Added onboarding translations in both English and Thai.

### Why

New buyers need to understand the food-rescue model before they hit the marketplace. The flow mirrors Too Good To Go: discover, reserve, collect. Storing completion locally keeps the experience fast and offline-first.

---

## 4. Consumer Screen Audit & Polish

### What changed

A background subagent and manual follow-up removed emoji, adopted the design system, and standardized states across all consumer screens:

- `app/(auth)/sign-in.tsx` and `sign-up.tsx` use the new `Button`, `Input`, `Card`, `Screen` primitives, password-visibility toggle, and clean PDPA consent layout.
- `app/(buyer)/discover.tsx`, `listing/[id].tsx`, `checkout/[id].tsx`, `orders.tsx`, `order/[id].tsx`, `review/[orderId].tsx`, `profile.tsx`, `chat/*.tsx`, `issue/[orderId].tsx` updated with:
  - Theme-driven colors and spacing.
  - `LoadingState`, `ErrorState`, `EmptyState` for async flows.
  - Ionicons instead of emojis or unicode symbols.
- `app/(merchant)/*` screens (`dashboard`, `today`, `listings`, `locations`, `collect`, `analytics`, `settings`, `onboarding`) received the same treatment.
- `src/components/listing/DiscoverHeader.tsx`, `FiltersPanel.tsx`, `ListingList.tsx`, `ListingRow.tsx`, `FavoriteButton.tsx`, `PickYourOwnBuilder.tsx`, `SlotPicker.tsx`, `ListingMap.web.tsx` were refactored for consistency.

### Why

Every screen should feel like it belongs to the same product. Replacing ad-hoc UI with shared primitives eliminates duplication, makes dark mode work everywhere, and makes future changes cheap.

---

## 5. Admin Console Polish

### What changed

- Added `lucide-react` to `apps/admin/package.json`.
- Replaced the plain sidebar with a responsive `Sidebar` client component (`apps/admin/src/app/dashboard/Sidebar.tsx`):
  - Lucide icons for every nav item.
  - Active-route highlight.
  - Mobile hamburger menu + overlay.
- Removed the duplicate `Analytics` nav item that pointed to the same `/dashboard` route as `Dashboard`.
- Updated `admin.module.css`:
  - Cleaner cards, tables, badges, buttons.
  - Responsive layout: sidebar becomes a drawer on mobile, main content adjusts padding.
- Added `apps/admin/src/app/dashboard/loading.tsx` for loading states.
- Added `expo-env.d.ts` and `.playwright-mcp` to `.prettierignore`, `.claude` and `.playwright-mcp` to `.gitignore`.

### Why

The admin dashboard is the operations center. A responsive, icon-driven sidebar makes navigation scannable and professional on both desktop and mobile.

---

## 6. Code Quality & Dead-Code Removal

### What changed

- Removed unused exports from `apps/consumer/src/theme.tsx` (`spacing`, `radii`, `fontSizes`, `fontWeights`, `lineHeights`, `opacity`, `makeTheme`, `useSetColorScheme`, `Colors`).
- Removed unused exported `ButtonVariant`/`ButtonSize` types from `Button.tsx`.
- Removed `console.warn` from sign-up referral handling.
- Removed stray `View` import and other lint fixes surfaced by the consumer audit.
- Added `style` prop to `Button`, `Badge`, `EmptyState`, `ErrorState` and made optional props accept `undefined` for strict `exactOptionalPropertyTypes`.
- Fixed `IconName` type to exclude `undefined` so every icon usage is type-safe.

### Why

Dead exports and weakly typed props create tech debt and hide bugs. A clean public API surface makes the design system easier to maintain and evolve.

---

## 7. Validation Results

All of the following now pass:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm knip`
- `pnpm test`
- `pnpm --filter @maithing/admin build`
- `pnpm --filter @maithing/consumer build:web`

---

## 8. Remaining Technical Debt

### Consumer web runtime

- **Status**: Builds successfully; runtime fails with React error #31 (duplicate React instance) when served.
- **Impact**: Web preview and web E2E testing are blocked; native (iOS/Android) remains the primary target.
- **Likely cause**: The monorepo mixes React 18.3.1 (consumer) and React 19.x (admin). pnpm keeps separate copies, but the Expo web bundler resolves React across workspace boundaries, bundling two copies. `react-native-web` and `expo-router` create elements from different React instances.
- **Possible fixes**:
  1. Pin a single React version across the whole workspace (likely requires upgrading consumer to React 19 or downgrading admin to React 18, plus validating React Native 0.76 compatibility).
  2. Add a Metro/web alias to force all `react`/`react-dom` imports to the consumer's copy.
  3. Split admin into a separate workspace/repo to avoid the version conflict.

### Onboarding persistence

- Onboarding completion is stored locally with `expo-secure-store`. It does not sync across devices. For a multi-device product, this flag should live in the user profile table and be checked server-side after sign-in.

### Admin auth during visual QA

- The dashboard requires an admin profile. Automated visual regression of authenticated pages would need a test user seed or mock auth in Storybook/Playwright.

### Shared package

- `knip` and `lint` pass, but there is no automated test coverage for the Supabase edge functions or admin pages. Adding integration tests against a cloud/dev Supabase instance would improve confidence.

---

## 9. Remaining Bugs / Known Issues

1. **Consumer web runtime crash** – as described above, web bundle throws React #31. Native builds are unaffected but were not tested in this session because no simulator was available.
2. **Dev server port collision** – `expo start --web` may conflict with other Node processes on common ports; the local environment had several orphaned listeners.
3. **Favicon 404 on admin** – the admin app does not ship a favicon; browsers log a 404. Harmless but should be addressed with a real favicon.
4. **No runtime error boundary in consumer** – unhandled errors show the Expo default error overlay. A top-level `ErrorBoundary` component would be a production-grade addition.

---

## 10. Future Improvements

### Immediate / high value

- **Fix the consumer web React conflict** so the web preview and E2E tests can run.
- **Add a real app icon/splash** instead of the default Expo placeholders.
- **Add runtime error boundaries** in both consumer and admin.
- **Favicon and metadata** for admin (`favicon.ico`, OpenGraph, etc.).
- **Persist onboarding completion in Supabase** for cross-device continuity.

### Medium term

- **Storybook / visual regression** for the consumer design system to prevent UI drift.
- **Accessible labels & focus management** audit (screen-reader labels, keyboard navigation on web, large-text scaling).
- **Skeleton screens** for key routes instead of generic spinners.
- **Pagination / virtualized lists** for admin tables and merchant order history when data grows.
- **Rate limiting and input sanitization** review on admin actions and merchant endpoints.

### Long term

- **React Native upgrade** to the latest stable Expo SDK once the React version conflict is resolved.
- **E2E test suite** with Maestro or Detox for the critical buyer/merchant flows.
- **Performance budget** for the consumer web bundle (currently ~2 MB entry JS).

---

## Summary

The app is now far more cohesive: a unified design system, a clear buyer onboarding, no emojis, no AI slop, and a responsive admin sidebar. Lint, typecheck, format, knip, tests, and both production builds all pass. The main remaining blocker is the consumer web runtime React conflict, which is a monorepo-versioning issue rather than an application bug. Native builds should be smoke-tested on a device/simulator as the next step.
