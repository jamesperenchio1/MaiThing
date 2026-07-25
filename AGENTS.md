# Agent Guide — Maithing

> Read the exact Expo SDK 57 docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. The project runs on Expo SDK 57 / React 19 / React Native 0.86 and uses file-system routing through `expo-router`.

## Project Overview

Maithing is a surplus-food marketplace for Thailand — a Too Good To Go / Yindii-style mobile app that connects food businesses with buyers who rescue discounted food for self-pickup. The codebase is a single Expo app with two primary user roles:

- **Customer** — browse listings, discover merchants, place orders, manage wallet, view profile.
- **Merchant** — dashboard, inventory, create listings, view orders, settings.

The app is currently backed entirely by **mock repositories** with realistic Thai demo data. There is no live backend or Supabase client in UI code; data access is abstracted behind repository interfaces so the backend can be swapped one repository at a time.

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
│       └── listings/new.tsx      # Create listing
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
- **Text component**: use `Text` from `src/components/ui/Text.tsx` with typed variants (`h1`–`h4`, `body`, `body-sm`, `caption`, `label`).
- **Icons**: use `lucide-react-native`.
- **Navigation**: file-system based. Route groups `(auth)`, `(customer)`, `(merchant)` hide their segment from the URL. Tab layouts are in `(tabs)/_layout.tsx`.
- **Haptics**: wrapped in press handlers (`Haptics.impactAsync`). No-ops on web.

## State Management

- **Server state**: TanStack Query hooks in `src/hooks/` call repositories. Default stale time is 5 minutes.
- **Global client state**: Zustand stores in `src/stores/`:
  - `auth` — current user, selected role, login/logout helpers.
  - `theme` — light / dark / system, persisted in AsyncStorage.
  - `language` — `en` or `th`, persisted and synced with i18next.
  - `cart` — in-memory cart (not persisted).

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
- To add a real backend, implement the same repository interfaces and swap the import in the hooks (currently `mockRepositories`).

## Maps

- Native: `react-native-maps` with Google provider on Android.
- Web: a dynamic Leaflet component (`LeafletMap`) loaded via `Map.web.tsx`.
- The map tab on web falls back to a merchant list view.
- Google Maps API key is configured in `app.json` under the `react-native-maps` plugin. The current value is a placeholder (`AIzaSyDUMMY_API_KEY_REPLACE_BEFORE_PRODUCTION`) and must be replaced before production.

## Testing

The project does **not** currently use Jest or React Native Testing Library. E2E coverage is provided by Maestro.

```bash
# Lint and typecheck
pnpm lint
pnpm lint:fix
pnpm typecheck

# Format
pnpm format
pnpm format:check
```

### Maestro E2E Flows

Flow files live in `.maestro/` and reference `appId: com.jamyangperenchio.maithing`:

- `customer-welcome-flow.yaml`
- `customer-tab-navigation.yaml`
- `customer-listing-detail.yaml`
- `customer-merchant-detail.yaml`
- `merchant-switch-flow.yaml`
- `merchant-create-listing.yaml`
- `run-all.yaml` — orchestrates all flows

Run them with the Maestro CLI on a device or emulator.

## Security Considerations

- **No real auth backend**: passwords are compared locally in mock repositories. Do not ship this to production without replacing auth with a secure backend.
- **API keys**: the only API key in `app.json` is a dummy Google Maps key. Replace it before releasing native builds.
- **Secrets**: store production secrets in environment variables or a secrets manager, not in `app.json`. `.env*.local` is already ignored.
- **Secure storage**: `expo-secure-store` is installed and configured as a plugin. Use it for tokens rather than AsyncStorage before production.
- **Deep links**: app scheme is `maithing://` (configured in `app.json`). Deep-link handlers should validate incoming URLs.
- **Input validation**: always use Zod schemas for form data on both client and (future) server.

## Known Limitations

- Web build works; native builds need verification on device/emulator (see `HANDOFF.md`).
- Camera / photo picker is simulated with placeholder URLs on web and in create-listing.
- Push notifications are mocked/no-ops on web.
- Native haptics are no-ops on web.
- Some screens still use `ScrollView` instead of `FlashList` for large lists.
- `LogBox.ignoreAllLogs(true)` is enabled in `app/_layout.tsx` — suppresses all React Native warnings in development.

## Deployment

- **Web**: run `npx expo export --platform web` to produce a static site in `dist/`.
- **Native**: use EAS Build (`eas build --platform android|ios`) or run `pnpm android` / `pnpm ios` locally. The bundle identifiers are:
  - iOS: `com.jamyangperenchio.maithing`
  - Android: `com.jamyangperenchio.maithing`
- **EAS / Expo**: not configured yet; add `eas.json` when ready for production builds.

## Health Checks (verified)

As of the latest check:

- `pnpm typecheck` passes (`tsc --noEmit`).
- `pnpm lint` passes with 2 warnings on generated `.expo/types/router.d.ts` files (unused `eslint-disable` directives). These are auto-generated and can be ignored or excluded from lint.
- Web export previously produced 56 static routes successfully.

## Useful Files to Read First

- `app/_layout.tsx` — root providers, fonts, splash, theme, notifications.
- `src/repositories/interfaces.ts` — data access contracts.
- `src/repositories/mock.ts` — current data implementation.
- `src/repositories/seed.ts` — demo merchants, listings, orders, wallet, notifications.
- `src/stores/auth.ts` — auth state shape.
- `src/lib/utils.ts` — `cn()` helper and formatting utilities.
- `src/components/ui/Button.tsx` — CVA-based button component pattern.
- `tailwind.config.js` + `global.css` — theme tokens.
