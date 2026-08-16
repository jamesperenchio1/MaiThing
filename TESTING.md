# Testing — Maithing

Three layers of verification: static checks (typecheck/lint/format), unit/component tests (Jest +
React Native Testing Library), and end-to-end flows (Maestro). CI runs the first two on every push
and PR; Maestro is run manually against a device or emulator.

## Static checks

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint              # ESLint (flat config, eslint.config.mjs)
pnpm lint:fix
pnpm format:check      # Prettier --check
pnpm format             # Prettier --write
```

## Unit / component tests (Jest + React Native Testing Library)

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Setup

- `jest.config.js` — uses the `jest-expo` preset (wraps `@react-native/jest-preset`), with a
  `transformIgnorePatterns` allowlist for the native-module packages actually in use (`expo-*`,
  `react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet`, `nativewind`,
  etc.) so their ESM source gets transformed instead of skipped.
- `jest` itself is pinned to **`^29.7.0`**, not the latest 30.x — `jest-expo@57.0.4`'s own
  dependencies (`@jest/globals`, `jest-snapshot`, `babel-jest`, …) are pinned to `^29.2.1`, and
  running a mismatched Jest major breaks `jest-mock`'s internal API (`clearMocksOnScope`). Don't
  bump `jest` past 29.x until `jest-expo` does.
- `src/test/setup.tsx` (registered as `setupFilesAfterEnv`) initializes i18next once for the whole
  run (`initializeI18n()` — it's a side-effecting singleton, not a React provider, so it doesn't
  need to wrap every render) and exports `renderWithProviders(ui, options?)`, which wraps a
  component in `SafeAreaProvider` (fixed `initialMetrics`, no native measurement needed) and a
  fresh per-test `QueryClientProvider` (retries disabled).
- `@testing-library/react-native@14.x`'s `render()` returns a **Promise** — always
  `await renderWithProviders(...)` before touching `screen`. Import `screen`/`fireEvent`/etc.
  directly from `@testing-library/react-native` in test files, not through the setup file.
- `__mocks__/react-native-mmkv.js` and `__mocks__/react-native-reanimated.js` are manual Jest
  mocks for native modules with no headless story: MMKV has no real JSI binding under Jest, and
  Reanimated 4 (with the new `react-native-worklets` split) throws on import without a native
  binary and no longer ships its own `setUpTests()` helper for this architecture. Jest picks these
  up automatically from `__mocks__/` at the repo root — no `jest.mock(...)` call needed in test
  files. If a test needs a Reanimated API the mock doesn't cover (see the mock file for the current
  list), extend the mock rather than trying to load the real module.

### What's covered so far

- `src/lib/utils.test.ts` — pure formatter/helper functions (`formatCurrency`, `formatDistance`,
  `formatCompactNumber`, `getListingUrgency`).
- `src/components/ui/Button.test.tsx`, `src/components/ui/Input.test.tsx` — render, press/change
  handlers, disabled/loading states, accessibility props, error/character-count display.

This is a starting point, not full coverage — add tests alongside new components/hooks as you
touch them, following the `renderWithProviders` pattern above.

## End-to-end (Maestro)

Flow files live in `.maestro/`, all targeting `appId: com.jamyangperenchio.maithing`.
`run-all.yaml` orchestrates the full suite via `runFlow:` references — when you add a new flow
file, add its `runFlow:` line there too.

```bash
maestro test .maestro/<flow>.yaml   # one flow, against a booted simulator/emulator or device
maestro test .maestro/run-all.yaml  # full regression suite
```

Current coverage by area (check `.maestro/` directly for the authoritative file list — this is a
summary, not an index to keep in sync by hand):

- **Auth** — sign-up field validation + successful account creation; sign-in invalid-email/wrong-password/success.
- **Customer** — welcome/onboarding, tab navigation, listing detail, merchant detail, buying a
  listing end-to-end, cancelling an order (refund to wallet), sold-out listing waitlist/notify
  toggle, wallet top-up, personality onboarding, switching the app language to Thai and back.
- **Merchant** — role switch, dashboard/settings navigation, creating a listing, analytics,
  personality setup, verification checklist, creating a coupon, inviting staff, payouts + bank
  account screen, replying to a review.
- **Offline** — offline-mode banner/behavior, offline-queue sync on reconnect.
- **Deep links** — `maithing://` listing/merchant/tab routes, plus an unknown-route fallback check.

### Conventions

- Selectors prefer `id:` (component `testID`) over `text:` — text selectors are only used for
  content that has no natural testID (e.g. native `Alert.alert` button labels, which can't carry a
  `testID`) or where matching the actual rendered copy is the point of the assertion (e.g. the
  Thai-locale flow). Text-selector flows assume the app is running in English unless a flow
  explicitly switches language.
- Every flow starts with `launchApp: { clearState: true }` plus the shared dismiss-dialog
  boilerplate (notification permission prompt, stray "Open in Maithing?" deep-link confirmation) —
  copy this preamble from an existing flow rather than reinventing it.
- Flows compose via `runFlow: other-flow.yaml` — e.g. most merchant flows start with
  `runFlow: merchant-switch-flow.yaml` to get from a cold launch to the merchant dashboard.
- Dynamic per-row `testID`s (e.g. `reply-to-review-${review.id}`) are matched with a regex `id:`
  selector (`id: "reply-to-review-.*"`) rather than hardcoding a specific seeded ID, so flows don't
  break when seed data changes.
- Maestro's own syntax checker (`maestro check-syntax <file>.yaml`) is cheap and catches malformed
  commands before you burn time on a device run — use it after editing a flow.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR: install (frozen lockfile),
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`. Maestro is **not** part of CI —
it needs a real device/emulator and a built app, which a standard GitHub-hosted runner can't
provide, so E2E stays a manual step run locally against a simulator/emulator (see above).

## Pre-commit hook

Husky + lint-staged run automatically on `git commit`: lint-staged applies `eslint --fix` to staged
`*.{ts,tsx}` and `prettier --write` to staged `*.{ts,tsx,js,jsx,json,md}`, then `pnpm typecheck`
runs against the whole project. See `.husky/pre-commit` and the `lint-staged` key in `package.json`.
