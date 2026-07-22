# Maithing

Thailand's surplus-food marketplace — a premium Too Good To Go / Yindii-style app connecting food businesses with buyers who rescue discounted food for self-pickup.

## Stack

- **Expo SDK 57** — latest stable
- **React 19 + React Native 0.86** — newest stable
- **Expo Router 4** — file-system routing
- **TypeScript 5** — strict mode
- **NativeWind 4** — Tailwind CSS for React Native
- **TanStack Query 5** — server state
- **Zustand 5** — global state
- **React Hook Form + Zod** — forms and validation
- **Reanimated 4** — 60 fps animations
- **i18next** — Thai + English
- **Mock repositories** — instant demo, Supabase-ready architecture

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the development server
npx expo start

# Press `w` to open the web version
# Scan the QR code with Expo Go for iOS/Android
# For remote networks, use `npx expo start --tunnel`
```

## Project Structure

```
maithing/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Welcome, sign-in, sign-up, forgot-password
│   ├── (customer)/               # Customer tabs
│   │   ├── (tabs)/               # home, discover, map, orders, wallet, profile
│   │   └── [feature]/            # listing, merchant, order, notifications
│   └── (merchant)/               # Merchant tabs
│       ├── (tabs)/               # dashboard, orders, inventory, settings
│       └── listings/new.tsx      # Create listing
├── src/
│   ├── components/               # UI primitives and composite components
│   ├── features/                 # Feature schemas and business logic
│   ├── hooks/                    # TanStack Query hooks
│   ├── repositories/             # Mock implementations + Supabase stubs
│   ├── services/                 # Query client, notifications, etc.
│   ├── stores/                   # Zustand stores
│   ├── i18n/                     # Thai/English translations
│   ├── lib/                      # Utilities and constants
│   └── types/                    # Shared TypeScript types
├── scripts/                      # Seed and dev helpers
├── tailwind.config.js            # Tailwind + design tokens
├── global.css                    # Tailwind directives
└── app.json                      # Expo config
```

## Test Accounts

On the welcome screen, tap:

- **Continue as Test Customer** — full customer account with wallet, favorites, and 150+ orders
- **Continue as Test Merchant** — merchant account with dashboard, orders, inventory, and analytics

## Available Scripts

```bash
pnpm typecheck          # TypeScript check
pnpm lint               # ESLint
pnpm lint:fix           # ESLint with auto-fix
pnpm format             # Prettier format
pnpm format:check       # Prettier check
pnpm web                # Expo web
```

## Architecture Notes

- All data access goes through `src/repositories/` interfaces.
- Mock repositories provide instant, realistic Thai demo data.
- Swapping to Supabase is a one-file change per repository.
- UI is decoupled from backend; no Supabase client in components.

## License

Private — see repository settings.
