# Agent Guide — Maithing

> Read the exact Expo SDK 57 docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. The project runs on Expo SDK 57 / React 19 / React Native 0.86 and uses file-system routing through `expo-router`.

## Project Overview

Maithing is a surplus-food marketplace for Thailand — a Too Good To Go / Yindii-style mobile app that connects food businesses with buyers who rescue discounted food for self-pickup. The codebase is a single Expo app with two primary user roles:

- **Customer** — browse listings, discover merchants, place orders, manage wallet, view profile.
- **Merchant** — onboarding, dashboard, inventory, create/edit listings with templates and image upload, orders & QR scanner, payouts & bank accounts, team & staff, promotions/coupons, customer messaging, reviews, analytics, and settings.

The app ships with **mock repositories** by default (`EXPO_PUBLIC_REPOSITORY_MODE` unset or not `supabase`) so developers can run it without a live backend. A full **Supabase repository implementation** exists in `src/repositories/supabase.ts` and is wired up for every repository interface (auth, users, merchants, listings, orders, wallet, payouts, coupons, messages, notifications, analytics). Flip to the live backend by setting `EXPO_PUBLIC_REPOSITORY_MODE=supabase` plus your Supabase URL/anon key — this project's own `.env.local` (gitignored) already has it set to `supabase`, so a fresh checkout with a copied `.env.local` runs against the real backend, not the mock one. UI code never imports backend clients directly; it always goes through the repository switcher in `src/repositories/index.ts`. Nothing about this split is fixed — swap the default, add a third repository implementation, or collapse the mock path entirely if the project no longer needs it.

## Technology Stack

- **Expo SDK 57** (`expo@~57.0.7`)
- **React 19** (`react@19.2.3`) + **React Native 0.86** (`react-native@0.86.0`)
- **Expo Router 4** for file-system routing (`expo-router@~57.0.7`)
- **TypeScript 6** in strict mode (`strict: true`)
- **NativeWind 4** + **Tailwind CSS 3** for styling
- **TanStack Query 5** for server-state fetching/caching
- **Zustand 5** for global client state
- **React Hook Form 7** + **Zod** for forms and validation
- **Reanimated 4** + `expo-haptics` for animations and haptics
- **i18next** for English / Thai localization
- **lucide-react-native** for icons
- **react-native-maps** (native) / **Leaflet** (web) for maps
- **pnpm** as the package manager

## Project Structure

```
maithing/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Welcome, sign-in, sign-up, forgot-password
│   ├── (customer)/               # Customer screens
│   │   ├── (tabs)/               # home, discover, map, orders, wallet, profile
│   │   └── [feature]/            # listing, merchant, order, notifications, favorites, saved-addresses
│   └── (merchant)/               # Merchant screens
│       ├── (tabs)/               # dashboard, orders, inventory, settings
│       ├── onboarding.tsx        # Merchant onboarding / Why Join
│       ├── listings/new.tsx      # Create / edit / duplicate listing
│       ├── order/[id].tsx        # Order detail
│       ├── scanner.tsx           # QR pickup-code scanner
│       ├── payouts/              # Payout overview + bank account management
│       ├── messages/             # Customer conversations + thread
│       ├── staff.tsx             # Team & staff management
│       ├── promotions.tsx        # Coupons & promotions
│       ├── reviews.tsx           # Merchant reviews dashboard
│       ├── analytics.tsx         # Date-ranged analytics
│       ├── business-profile.tsx  # Business details
│       ├── store-hours.tsx       # Opening hours
│       └── pickup-management.tsx # Pickup instructions
├── src/
│   ├── components/               # UI primitives, composites, layouts, map wrappers, navigation
│   │   ├── ui/                   # Button, Text, Input, Card, Badge, Avatar, etc.
│   │   ├── composite/            # MerchantCard, ListingCard, FavoriteButton, etc.
│   │   ├── layout/               # Screen, Header, SearchBar
│   │   ├── map/                  # Map, Map.web, MerchantMap, LeafletMap
│   │   └── navigation/           # BottomTabBar
│   ├── features/                 # Feature-specific Zod schemas
│   │   ├── auth/schemas.ts
│   │   └── listings/schemas.ts
│   ├── hooks/                    # TanStack Query hooks that call repositories
│   ├── repositories/             # Repository interfaces + mock implementations + seed data
│   ├── services/                 # Query client, notifications setup
│   ├── stores/                   # Zustand stores (auth, cart, language, theme)
│   ├── i18n/                     # en.ts, th.ts, index.ts
│   ├── lib/                      # Utilities, constants, helpers, links, maps
│   └── types/                    # Shared TypeScript types
├── assets/                       # Fonts, icons, splash images
├── android/                      # Generated native Android project
├── ios/                          # Generated native iOS project
├── .maestro/                     # Maestro E2E flow files
├── app.json                      # Expo configuration
├── global.css                    # Tailwind directives + CSS variables
├── tailwind.config.js            # Tailwind + NativeWind preset
├── metro.config.js               # Metro + NativeWind setup
├── babel.config.js               # Babel preset for Expo + NativeWind
├── tsconfig.json                 # TypeScript, extends expo/tsconfig.base
└── eslint.config.mjs             # Flat ESLint config
```

## Build and Run Commands

All commands assume dependencies are installed with `pnpm install`.

```bash
# Start the dev server
pnpm start              # expo start

# Platform-specific dev builds
pnpm android            # expo run:android
pnpm ios              # expo run:ios

# Web
pnpm web              # expo start --web
# Static web export
npx expo export --platform web
```

- `app.json` configures web output as static (`"output": "static"`) and uses Metro as the web bundler.
- `main` in `package.json` is `expo-router/entry`.
- The native `android/` and `ios/` directories are present and managed by Expo. Use `expo run:android` / `expo run:ios` to build them.

## Test Accounts

On the welcome screen you can tap:

- **Continue as Test Customer** — full customer account with wallet, favorites, and 150+ seeded orders.
- **Continue as Test Merchant** — merchant account with dashboard, inventory, orders, and analytics.

You can also sign in with these mock credentials:

- Customer: `customer@maithing.test` / `password`
- Merchant: `merchant@maithing.test` / `password`

OTP verification in mock auth accepts `123456`.

## Code Style and Conventions

- **Formatter**: Prettier (`prettier.config.js`)
  - `semi: true`
  - `singleQuote: true`
  - `tabWidth: 2`
  - `trailingComma: 'es5'`
  - `printWidth: 100`
  - `bracketSameLine: false`
  - `arrowParens: 'always'`
- **Linter**: ESLint flat config in `eslint.config.mjs` using `@typescript-eslint`, `react`, `react-hooks`, and `react-native` plugins.
- **Path alias**: `@/*` maps to the project root (configured in `tsconfig.json`).
- **Platform splits**: use `.web.tsx` for web-specific components (e.g. `Map.web.tsx`). Metro resolves them automatically.
- **Styling**: NativeWind/Tailwind classes are used everywhere. Design tokens are CSS variables in `global.css` and mirrored in `tailwind.config.js`. Dark mode is class-based (`dark` class toggled on the root view).
- **Colors**: primary green (`#16A34A` light / `#4ADE80` dark), warm off-white background (`#FFFBF7`), dark background (`#0F1419`).
- **Fonts**: `Inter` and `NotoSansThai` are loaded in `app/_layout.tsx`.
- **Components**: prefer the custom UI primitives in `src/components/ui/` (`Text`, `Button`, `Input`, `Card`, `Badge`, etc.) over raw React Native components.
- **Screen wrapper**: use `Screen` from `src/components/layout/Screen.tsx` for safe-area-aware scrollable screens.
- **Text component**: use `Text` from `src/components/ui/Text.tsx` with typed variants (`h1`–`h4`, `body`, `body-sm`, `caption`, `label`). The `Text` primitive scales automatically with screen width and respects the system font-scale setting.
- **Responsive sizing**: use helpers in `src/lib/responsive.ts` (`useResponsiveScale`, `useScaledSize`, `getFontScale`) for fixed layout values (heights, tab bars, icon sizes) that should adapt across phones and tablets. Avoid hardcoded `fontSize` in raw `style` objects.
- **Icons**: use `lucide-react-native`.
- **Navigation**: file-system based. Route groups `(auth)`, `(customer)`, `(merchant)` hide their segment from the URL. Tab layouts are in `(tabs)/_layout.tsx`.
- **Haptics**: wrapped in press handlers (`Haptics.impactAsync`). No-ops on web.

## Internationalization (i18n)

- The app supports **English and Thai** via `i18next` + `react-i18next`. Translation strings live
  in `src/i18n/en.ts` and `src/i18n/th.ts` as two structurally parallel nested objects with 8
  top-level namespaces: `app, auth, common, customer, merchant, personality, tutorial, validation`.
- **Every user-facing string must go through `t('namespace.key')`** — never hardcode English text
  in JSX, `placeholder` props, or `Alert.alert()` calls. Add a new key to `en.ts` and `th.ts`
  **together, in the same change** — a key present in only one file is a bug (there's no automated
  parity check, so verify manually or with a quick script diffing the two files' key sets).
- Interpolation uses `{{value}}` placeholders: `t('customer.cart.purchaseNote', { merchant })`.
  Plural forms use i18next's `_one`/`_other` suffixes (e.g. `reviewCount_one` / `reviewCount_other`)
  — include both even for keys where Thai's plural rule wouldn't strictly need `_one`, to match the
  existing convention in `th.ts`.
- For locale-aware **dates, times, and numbers**, use the helpers in `src/lib/utils.ts`
  (`formatCurrency`, `formatDistance`, `formatRelativeTime`, `formatPickupWindow`,
  `formatCompactNumber`, `getMerchantOpenStatus`) — they all accept a `locale` param, pass
  `i18n.language` (from `useTranslation()`). Never call `.toLocaleDateString('en-US', ...)` or
  similar with a hardcoded locale.
- **Zod validation messages** are localized via a global i18next-aware error map
  (`src/i18n/zodErrorMap.ts`, registered in `initializeI18n()`) that reads the `validation.*`
  namespace for built-in issue types (required/too-small/email/etc.). Business-rule `.refine()`
  checks use the lazy message-function form (`.refine(fn, () => ({ message: i18n.t('validation.x') }))`)
  so they stay reactive to a language switch — schemas themselves stay module-level singletons, no
  per-component rebuild needed.

## Accessibility

- Every custom interactive component needs `accessibilityRole`, and either `accessibilityLabel`
  (for icon-only controls) or rely on visible text content. Toggles/tabs/selectable chips also need
  `accessibilityState={{ selected }}` or `{{ disabled }}` as appropriate. See `Button.tsx` for the
  reference implementation (`accessibilityRole="button"`, `accessibilityState={{ disabled }}`,
  forwards all `PressableProps` so callers can add `accessibilityLabel`/`accessibilityHint`).
- `eslint-plugin-react-native-a11y` is registered in `eslint.config.mjs` at `warn` (not `error`) —
  treat its warnings as a checklist to work through over time, not a hard gate. Run `pnpm lint` and
  look for `react-native-a11y/*` warnings when touching a screen.
- Accessibility labels are translated strings (`t('...')`), not hardcoded English — same rule as
  any other user-facing text.

## State Management

- **Server state**: TanStack Query hooks in `src/hooks/` call repositories. Default stale time is 5 minutes.
- **Global client state**: Zustand stores in `src/stores/`, all persisted via `mmkvZustandStorage`
  (`src/lib/mmkvStorage.ts` — real MMKV on native, a synchronous `localStorage`-backed shim on web):
  - `auth` — current user, selected role, login/logout helpers.
  - `theme` — light / dark / system.
  - `language` — `en` or `th`, synced with i18next on rehydration.
  - `cart` — cart items, grouped by merchant; survives app restarts (expired listings are pruned on rehydration).

## Forms and Validation

- Forms use `react-hook-form` with `zodResolver`.
- Schemas live in `src/features/<feature>/schemas.ts`.
- Example validation rules:
  - `createListingSchema` requires `salePrice < originalPrice` and `pickupWindowEnd > pickupWindowStart`.
  - `signUpSchema` requires password ≥ 8 characters and matching confirmation.

## Data Layer

- Repository interfaces are defined in `src/repositories/interfaces.ts`.
- Mock implementation is in `src/repositories/mock.ts` and seeded data in `src/repositories/seed.ts`.
- UI code should **never** import backend clients directly; always go through repository interfaces/hooks.
- To add a real backend, implement the same repository interfaces in `src/repositories/supabase.ts` (or a new file) and set `EXPO_PUBLIC_REPOSITORY_MODE=supabase`. See the top of `supabase.ts` for the expected table list.

## Maps

- Native: `react-native-maps` with Google provider on Android.
- Web: a dynamic Leaflet component (`LeafletMap`) loaded via `Map.web.tsx`.
- The map tab on web falls back to a merchant list view.
- Google Maps API key is configured in `app.json` under the `react-native-maps` plugin. The current value is a placeholder (`AIzaSyDUMMY_API_KEY_REPLACE_BEFORE_PRODUCTION`) and must be replaced before production.

## Testing

Unit/component tests use Jest + `jest-expo` + React Native Testing Library; E2E coverage is
provided by Maestro. A pre-commit hook (Husky + lint-staged) runs ESLint/Prettier on staged files
plus a full typecheck; CI (`.github/workflows/ci.yml`) runs typecheck/lint/format:check/test on
every push and PR. See [`TESTING.md`](./TESTING.md) for full details — the setup notes below are
just enough to get commands running.

```bash
# Lint and typecheck
pnpm lint
pnpm lint:fix
pnpm typecheck

# Format
pnpm format
pnpm format:check

# Unit/component tests
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Maestro E2E Flows

Flow files live in `.maestro/` and reference `appId: com.jamyangperenchio.maithing`. Coverage
spans auth (sign-up/sign-in validation and success), customer flows (welcome/onboarding, tab
navigation, listing and merchant detail, buying a listing, cancelling/refunding an order, sold-out
waitlist notify, wallet top-up, Thai-locale switch), merchant flows (role switch, dashboard
settings, create-listing, analytics, personality setup, verification, coupons, staff invites,
payouts/bank accounts, review replies), offline behavior (offline mode, offline sync), and deep
links (`maithing://` listing/merchant/tab routes, including an unknown-route fallback check).
`run-all.yaml` orchestrates the full suite. When adding a new flow, add its `runFlow:` line to
`run-all.yaml` too — don't let this doc enumerate filenames, since that list goes stale; check
`.maestro/` directly for the current set.

Run them with the Maestro CLI on a device or emulator (`maestro test .maestro/<flow>.yaml`).

## Security Considerations

- **Real auth backend (Supabase mode)**: `src/repositories/supabase.ts` calls `supabase.auth.signInWithPassword` / `signUp` / `resetPasswordForEmail` / `verifyOtp` for real — passwords are never compared client-side in this mode. Mock mode (`src/repositories/mock.ts`) still compares passwords in-memory and must never be shipped as the production build's default.
- **API keys**: `app.json` contains real (non-placeholder) Google Maps API keys for Android and iOS. Verify in the Google Cloud Console that each key is restricted to its bundle ID/package + SHA-1 fingerprint (see [`docs/GOOGLE_MAPS_SETUP.md`](docs/GOOGLE_MAPS_SETUP.md)) rather than assuming they're safe because they're already committed.
- **Secrets**: store production secrets in environment variables or a secrets manager, not in `app.json`. `.env*.local` is already ignored; this repo's own `.env.local` holds the live Supabase URL/anon key and is not committed.
- **Secure storage**: `expo-secure-store` is wired up as the Supabase auth session storage adapter (`src/lib/supabase.ts`) on native. Web has no `SecureStore` equivalent, so the Supabase JS client falls back to in-memory session persistence there (no `AsyncStorage` fallback is used, deliberately — plain `AsyncStorage` is not encrypted).
- **Deep links**: app scheme is `maithing://` (configured in `app.json`). Deep-link handlers should validate incoming URLs.
- **Input validation**: always use Zod schemas for form data on the client; row-level security policies on the Supabase side are the actual server-side boundary — check `supabase/migrations/` before assuming client validation alone is sufficient.

## Known Limitations

- Camera / photo picker is simulated with placeholder URLs on web and in create-listing — no `expo-image-picker` wiring yet.
- Push notifications are no-ops on web; native delivery goes through the `supabase/functions/` Edge Function + Expo Push Service (see [`docs/PUSH_NOTIFICATIONS.md`](docs/PUSH_NOTIFICATIONS.md)).
- Native haptics are no-ops on web.
- Some screens still use `ScrollView` instead of `FlashList` for large lists (see [`QUALITY_OF_LIFE_IMPROVEMENTS.md`](QUALITY_OF_LIFE_IMPROVEMENTS.md) for the current per-screen breakdown).
- `LogBox.ignoreAllLogs(true)` is enabled in `app/_layout.tsx` — suppresses all React Native warnings in development.
- The Supabase repository expects a specific set of tables; `supabase/migrations/` now contains the schema migrations for this project's own Supabase instance, so a fresh project just needs those migrations applied rather than the tables hand-built.
- Stripe Connect / PromptPay are not integrated yet — payouts UI exists without a live payment processor behind it.
- No Sentry or other crash/error-tracking service is wired in.

## Deployment

- **Web**: run `npx expo export --platform web` to produce a static site in `dist/`.
- **Native**: use EAS Build (`eas build --platform android|ios`) via the profiles in `eas.json` (`development`, `preview`, `production`), or run `pnpm android` / `pnpm ios` locally. The bundle identifiers are:
  - iOS: `com.jamyangperenchio.maithing`
  - Android: `com.jamyangperenchio.maithing`
- **CI**: `.github/workflows/ci.yml` runs typecheck, lint, format:check, and test on every push to `main` and every PR. Maestro E2E is intentionally not in CI (needs a real device/emulator) — run it manually.

## Health Checks

Everything below is a point-in-time snapshot, not a guarantee — re-run the commands yourself before relying on them:

- `pnpm typecheck` passes (`tsc --noEmit`).
- `pnpm lint`, `pnpm format:check`, and `pnpm test` are all gated in CI on every push/PR.
- Nothing here — file locations, the mock/Supabase split, naming, or any convention in this doc — is a fixed rule. Update this file (and the others in the repo) whenever the codebase changes; treat it as a description of current state, not a constraint on what comes next.

## Useful Files to Read First

- `app/_layout.tsx` — root providers, fonts, splash, theme, notifications.
- `src/repositories/interfaces.ts` — data access contracts.
- `src/repositories/supabase.ts` — live backend implementation (default in this repo).
- `src/repositories/mock.ts` — offline/no-backend fallback implementation.
- `src/repositories/seed.ts` — demo merchants, listings, orders, wallet, notifications (used by the mock implementation).
- `src/stores/auth.ts` — auth state shape.
- `src/lib/utils.ts` — `cn()` helper and formatting utilities.
- `src/components/ui/Button.tsx` — CVA-based button component pattern.
- `tailwind.config.js` + `global.css` — theme tokens.
