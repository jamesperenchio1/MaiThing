# Handoff Notes — Maithing

Snapshot of what's wired up vs. what still needs a human to verify on-device. This file describes
the current state of the codebase — nothing in it is a fixed rule, update it freely as the app
changes.

## Backend

- Supabase is the live backend (`src/repositories/supabase.ts`), covering auth, users, merchants,
  listings, orders, wallet, payouts, coupons, messages, notifications, and analytics.
- This repo's `.env.local` (gitignored) points at a real Supabase project with
  `EXPO_PUBLIC_REPOSITORY_MODE=supabase` set — a fresh checkout with that file copied over runs
  against the live backend, not the mock one.
- Schema lives in `supabase/migrations/`; Edge Functions (push notifications, etc.) live in
  `supabase/functions/`.
- The in-memory mock repositories (`src/repositories/mock.ts` + `seed.ts`) remain available as a
  no-backend fallback for UI-only work — unset `EXPO_PUBLIC_REPOSITORY_MODE` (or set it to
  anything other than `supabase`) to use them.

## Build & CI

- `eas.json` defines `development` / `preview` / `production` EAS Build profiles.
- `.github/workflows/ci.yml` runs `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and
  `pnpm test` on every push to `main` and every PR.
- Maestro E2E is intentionally not in CI — it needs a real device/emulator. Run it manually
  (`maestro test .maestro/run-all.yaml`) against a simulator/emulator/device.

## What's verified on Expo Web (`npx expo export --platform web`)

- TypeScript strict mode passes (`pnpm typecheck`)
- ESLint passes (`pnpm lint`)
- NativeWind 4 + Tailwind CSS 3 compiles and bundles
- Full route tree renders: auth (welcome/sign-in/sign-up/forgot-password), customer tabs
  (home/discover/map/orders/wallet/profile) plus listing/merchant/order detail, cart, favorites,
  notifications, messages, saved-addresses; merchant tabs (dashboard/orders/inventory/settings)
  plus create-listing, analytics, messages, payouts, promotions, reviews, staff, business-profile,
  store-hours, pickup-management, broadcast, verification, scanner
- Dark mode classes apply correctly
- Thai/English i18n strings are wired and switch correctly on reload (persisted language is passed
  into `i18next.init()`, not applied after the fact)
- Supabase auth (sign-in/sign-up/OTP/sign-out) round-trips against the real backend in Supabase mode

## What still needs verification on a physical device / simulator (Expo Go or a dev build)

- Native splash screen and custom font loading
- Native tab bar haptics and transitions
- `react-native-maps` native map rendering, pins, user location
- `expo-haptics` impact feedback on buttons
- Push notification delivery end-to-end (Edge Function → Expo Push Service → device) — see
  [`docs/PUSH_NOTIFICATIONS.md`](docs/PUSH_NOTIFICATIONS.md)
- Camera / photo picker in create listing (currently simulated with placeholder URLs — no
  `expo-image-picker` wiring yet)
- Deep linking from notifications
- Biometric/secure token storage with `expo-secure-store` (wired for Supabase auth sessions on
  native — confirm session persistence across app restarts on a real device)
- Large text / accessibility scaling
- VoiceOver / TalkBack screen-reader labels

## How to run on your phone

```bash
npx expo start
# Scan the QR code with the Expo Go app
# If your phone is not on the same network, run: npx expo start --tunnel
```

## Known Web Limitations

- Map screen falls back to a merchant list on web because `react-native-maps` requires native.
- Photo upload in create listing is simulated with placeholder URLs on web (and in Expo Go).
- Native haptics are no-ops on web.
- Push notifications are no-ops on web; real delivery is native-only.

## Open items before a public production release

These are gaps, not rules — pick them up in whatever order makes sense:

1. Real photo upload flow (`expo-image-picker` + Supabase Storage) to replace placeholder image URLs.
2. Stripe Connect for merchant payouts, plus PromptPay/card payments for customers.
3. Verify Google Maps API key restrictions in the Google Cloud Console (keys are already real/committed — see [`docs/GOOGLE_MAPS_SETUP.md`](docs/GOOGLE_MAPS_SETUP.md)).
4. Sentry or similar crash/error tracking.
5. Broader Jest/RTL unit coverage — currently just `src/lib/utils.test.ts`, `Button.test.tsx`, `Input.test.tsx`; most coverage is Maestro E2E.
6. On-device verification pass for the items listed above.
