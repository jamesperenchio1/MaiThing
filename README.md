# Maithing

Thailand's surplus-food marketplace — a Too Good To Go / Yindii-style mobile app connecting food businesses with buyers who rescue discounted food for self-pickup. Built for two user roles: **Customer** and **Merchant**.

---

## Stack

| Layer           | Library / Version                                                    |
| --------------- | -------------------------------------------------------------------- |
| Runtime         | Expo SDK 57 · React 19 · React Native 0.86                           |
| Routing         | Expo Router 4 (file-system, typed routes)                            |
| Language        | TypeScript 6 (strict mode)                                           |
| Styling         | NativeWind 4 + Tailwind CSS 3                                        |
| Server state    | TanStack Query 5                                                     |
| Global state    | Zustand 5                                                            |
| Forms           | React Hook Form 7 + Zod                                              |
| Animation       | Reanimated 4 + expo-haptics                                          |
| Localization    | i18next (English + Thai)                                             |
| Icons           | lucide-react-native                                                  |
| Maps            | react-native-maps (native) / Leaflet (web)                           |
| Package manager | pnpm                                                                 |
| Data layer      | Supabase (live) with a mock-repository fallback for offline dev      |
| Backend         | Supabase — Postgres, Auth, Realtime, Storage, Edge Functions         |
| Build/CI        | EAS Build (`eas.json`) + GitHub Actions (`.github/workflows/ci.yml`) |

---

## Quick Start

```bash
pnpm install
pnpm start          # expo start — opens the dev server
pnpm web            # expo start --web
pnpm ios            # expo run:ios
pnpm android        # expo run:android
```

Press `w` in the terminal to open the web build. Scan the QR code with **Expo Go** for iOS/Android.

### Backend mode

The app talks to a live Supabase project by default in this repo (`EXPO_PUBLIC_REPOSITORY_MODE=supabase` in `.env.local`, alongside `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`). Unset `EXPO_PUBLIC_REPOSITORY_MODE` (or set it to anything other than `supabase`) to fall back to the in-memory mock repositories — useful for offline UI work with no backend dependency. UI code never imports either backend directly; both implement the same interfaces in `src/repositories/interfaces.ts` and are selected in `src/repositories/index.ts`.

---

## Test Accounts

**Mock mode** — tap on the welcome screen or use these credentials:

| Role     | Email                    | Password   | OTP      |
| -------- | ------------------------ | ---------- | -------- |
| Customer | `customer@maithing.test` | `password` | `123456` |
| Merchant | `merchant@maithing.test` | `password` | `123456` |

Or tap **Continue as Test Customer / Test Merchant** — no credentials needed.

**Supabase mode** — sign up for a real account (real email/password auth, OTP emails sent by Supabase); the mock shortcuts and canned credentials above only work in mock mode.

---

## Project Structure

```
maithing/
├── app/
│   ├── (auth)/                   # Welcome, sign-in, sign-up, forgot-password
│   ├── (customer)/
│   │   ├── (tabs)/               # home, discover, map, orders, wallet, profile
│   │   ├── listing/[id].tsx      # Listing detail + cart add
│   │   ├── merchant/[id].tsx     # Merchant profile
│   │   ├── order/[id].tsx        # Order detail + QR + navigation
│   │   ├── cart.tsx              # Multi-item cart + checkout
│   │   ├── favorites.tsx
│   │   ├── notifications.tsx
│   │   └── saved-addresses.tsx
│   └── (merchant)/
│       ├── (tabs)/               # dashboard, orders, inventory, settings
│       ├── listings/new.tsx      # Create / edit / duplicate listing
│       ├── order/[id].tsx        # Order detail + scanner shortcut
│       ├── scanner.tsx           # QR pickup-code scanner
│       ├── analytics.tsx         # Full analytics dashboard
│       ├── messages/             # Customer conversations + thread
│       ├── payouts/              # Payout overview + bank accounts
│       ├── promotions.tsx        # Coupons & promotions
│       ├── reviews.tsx           # Merchant reviews dashboard
│       ├── staff.tsx             # Team & staff management
│       ├── business-profile.tsx
│       ├── store-hours.tsx
│       ├── pickup-management.tsx
│       ├── broadcast.tsx         # Broadcast message to followers
│       └── verification.tsx      # Business verification flow
├── src/
│   ├── components/
│   │   ├── ui/                   # Button, Text, Input, Card, Badge, Avatar,
│   │   │                         #   BarChart, QRCode, Skeleton, PressableScale, …
│   │   ├── composite/            # MerchantCard, ListingCard, FavoriteButton, …
│   │   ├── layout/               # Screen, Header, SearchBar, ErrorBoundary
│   │   ├── map/                  # Map, Map.web, MerchantMap, LeafletMap
│   │   └── navigation/           # BottomTabBar (animated pill)
│   ├── features/                 # Zod schemas (auth, listings)
│   ├── hooks/                    # TanStack Query hooks
│   ├── repositories/             # Interfaces + Supabase (live) + mock implementation + seed data
│   ├── services/                 # Query client, notifications
│   ├── stores/                   # Zustand: auth, cart, language, theme
│   ├── i18n/                     # en.ts, th.ts, index.ts
│   ├── lib/                      # utils, constants, formatters, maps helper
│   └── types/                    # Shared TypeScript types
├── .maestro/                     # E2E flows
├── .github/workflows/ci.yml      # Lint, typecheck, format, test on every push/PR
├── supabase/
│   ├── migrations/                # SQL schema migrations
│   └── functions/                 # Edge Functions (push notifications, etc.)
├── legal-site/                    # Static privacy/support pages
├── eas.json                       # EAS Build profiles (development/preview/production)
├── global.css                    # Tailwind directives + CSS variables
├── tailwind.config.js
└── app.json
```

---

## Commands

```bash
pnpm typecheck          # tsc --noEmit
pnpm lint               # ESLint
pnpm lint:fix           # ESLint --fix
pnpm format             # Prettier
pnpm format:check       # Prettier --check
```

---

## Feature Inventory

### Auth

- Welcome screen with role picker
- Sign-in / sign-up / forgot-password — real Supabase auth by default in this repo; falls back to mock auth (in-memory, accepts password `password`) when `EXPO_PUBLIC_REPOSITORY_MODE` isn't `supabase`
- OTP verification — real email OTP via Supabase in Supabase mode; mock mode accepts `123456`
- Password visibility toggle on sign-in
- Deep-link session handler for OAuth flows (LINE/Google scaffold)

---

### Customer — Discovery

- **Home tab** — hero banner, promoted listings, category chips, Going Fast shelf (listings with ≤ 3 remaining, sorted by urgency), Favourites shelf, Recently Viewed shelf, nearby merchants
- **Discover tab** — full-text search with 300 ms debounce, sort chips (Nearest / Top Rated / Going Fast / New), minimum-rating filter (1–5 stars), category chips, results list
- **Map tab** — interactive map (react-native-maps native / Leaflet web), merchant pins with rating callout, filter chips (category, Open Now, Nearby ≤5 km), list fallback on web
- **NEW badge** on merchant cards for merchants joined within the last 30 days
- Post-checkout upsell modal showing nearby active listings from the same merchant

---

### Customer — Listings & Cart

- Listing detail screen — image, price, original price, discount %, description, allergens, dietary tags, pickup window, quantity stepper, merchant card
- **Flash sale support** — `⚡ Flash` badge on listing cards and detail, effective price used everywhere, countdown timer (MM:SS) on active flash sales
- **Waitlist count** displayed when listing is sold out (FOMO counter)
- **Restock alert toggle** on sold-out listings — notifies when merchant restocks
- Add to Cart + Buy Now on listing detail
- **Cart screen** — multi-item, grouped by merchant, quantity controls, remove item, wallet balance shown, order note field, checkout → order confirmation
- Cart persists across app restarts via Zustand + AsyncStorage; expired listings pruned on rehydration

---

### Customer — Orders

- Orders tab with **status filter chips** (All / Active / Completed / Cancelled)
- Order search by merchant name, item title, or pickup code
- **Order detail** — timeline stepper (pending → confirmed → preparing → ready → picked up), QR code for pickup code, pickup window, order note
- **Pickup navigation button** — opens Apple Maps (iOS) / Google Maps (Android) / Google Maps web for directions to the merchant
- **Chat with merchant** button on active orders → opens conversation thread
- **Review nudge banner** on completed orders that haven't been reviewed
- Reorder button on completed orders — re-adds same items to cart
- Cancel order with reason picker and refund to wallet (instant, with notification)
- Add to Calendar button on order confirm and detail (expo-calendar)
- Customer pickup reminder notification scheduled 30 min before pickup window closes

---

### Customer — Profile & Impact

- Profile screen — name, avatar, wallet balance, notification preferences
- **Meals Saved counter** — card showing total meals rescued, CO₂ saved (kg), and money saved across all completed orders
- Language toggle (EN/TH) and dark/light/system theme toggle
- Wallet screen — balance, transaction history (top-up, payment, refund)
- Notification preferences per category (new deals, order updates, messages, promotions)
- Version / build number shown at bottom (expo-constants)

---

### Customer — Merchant Profile

- Merchant detail screen — logo, cover, rating, review count, category, hours, location map
- Follow / unfollow toggle with notification bell (get notified when merchant posts new listings)
- Merchant listings grid
- Reviews tab with rating breakdown

---

### Merchant — Dashboard

- Summary stats — today's revenue, today's orders, total items saved, conversion rate, avg order value, total followers
- **Revenue goal progress bar** — shown when `merchant.revenueGoal` is set; fills with actual revenue, shows % complete and amount remaining / "Goal reached! 🎉"
- **Follower milestone celebration card** — fires when follower count crosses milestones (10, 25, 50, 100, 250, 500, 1 000, 2 500, 5 000)
- Quick actions — Create Listing, Scanner, Promotions, Broadcast
- Pending pickup rows with inline **scanner shortcut button** (deep links to scanner pre-loaded with the order's pickup code)
- Recent orders list
- Business verification progress card

---

### Merchant — Inventory

- Inventory list with status tabs (Active / Sold Out / Expired / Drafts)
- **Inline stock ± stepper** on active cards — tap + / − without opening the edit form
- **One-tap relist** expired listing — reactivates for today with a new pickup window
- **Sell-through % badge** on all non-draft cards (sold / original quantity)
- Low-stock warning when `quantityRemaining` ≤ threshold
- **View count** (👁 N) shown on each card when `viewCount` data is available
- Last updated timestamp
- Long-press **bulk selection** — Pause / Delete / Adjust Price across multiple listings
- Attach promo action on inventory cards

---

### Merchant — Create / Edit Listing

- Full form: title, description, category, original price, sale price, quantity, tags, allergens, dietary flags, pickup window (start + end), images
- **Auto-delist when sold out toggle** — listing automatically moves to `sold_out` status when `quantityRemaining` hits 0
- **Flash sale section** — enable toggle, flash price input, duration (hours); flash sale computed from form data and stored as `flashSalePrice` + `flashSaleEndsAt`
- Real-time inline Zod validation (onChange mode)
- Currency formatting with Thai Baht separators
- Character counters on title (60) and description (300)
- Smart duplicate flow — copies listing with a pickup window picker modal
- Configurable low-stock threshold per listing

---

### Merchant — Orders

- Orders list with status filtering
- Long-press **bulk selection** — advance status, mark ready for multiple orders at once
- Order detail — customer info, items, pickup code, QR code, status timeline
- **Chat with customer** button on non-cancelled orders
- Advance order status buttons (confirm → prepare → ready → complete)
- **Auto-confirm orders toggle** in notification settings — new orders confirmed automatically

---

### Merchant — Scanner

- QR code scanner for pickup codes
- Deep-link from dashboard pickup rows (`scanner?code=XXX`) pre-loads the code
- Confirm pickup flow

---

### Merchant — Analytics

- Date range filter (This Week / This Month / All Time)
- Daily / Weekly (8-week) revenue chart toggle
- Key metric cards — total revenue, total orders, items saved, avg order value, store views, conversion rate
- Customer retention card — **live repeat customer rate** (% of customers who ordered more than once)
- **AOV Trend chart** — 8-week bar chart of average order value from `analytics.weeklyAOV`
- **Follower Growth chart** — bar chart from `analytics.followerHistory`, with current count and period delta
- **Peak pickup heatmap** — 6-row × 7-column grid (4-hour bands: 0–3, 4–7, 8–11, 12–15, 16–19, 20–23 × Mon–Sun)
- **Top listings table** — ranked by revenue with bar, plus views 👁, clicks 🖱, search appearances 🔍, and conversion rate per listing (from enriched analytics data)
- Hourly revenue chart
- Deep-link support: `/(merchant)/analytics?metric=todayRevenue` scrolls to the right section

---

### Merchant — Messages

- Conversations list (primary tab)
- Thread view — message bubbles, send field, timestamp
- **Auto-created conversation** when a customer places an order — no manual initiation needed, mirrors Grab / food delivery chat UX
- Customer can open chat from their order detail; merchant can open chat from their order detail

---

### Merchant — Other Screens

- **Reviews** — overall rating, breakdown by star, review list with merchant reply option
- **Promotions** — create / manage coupons and discount codes
- **Payouts** — payout overview, bank account management
- **Staff** — team member list, invite, role assignment
- **Business profile** — name, logo, description, category, address
- **Store hours** — open/closed toggle with closure duration, per-day schedule
- **Pickup management** — instructions for customers
- **Broadcast** — send a message to all followers (160-char limit, i18n'd)
- **Verification** — multi-step business verification flow with auto-verify and dashboard progress card

---

### Infrastructure & Cross-Cutting

- **Global error boundary** with friendly fallback and retry (class component wrapping root Stack)
- **Push notification infrastructure** — server-side scheduling scaffolded, local notifications with deep-link URL and preference gating
- **Notification deep links** — tapping any notification navigates to the correct screen
- **Reduce motion support** — `useReducedMotion` hook wired into Button, PressableScale, Skeleton
- **Dark mode** — class-based, toggleable, persisted; all screens support it
- **Animated tab bar** — spring-animated active-pill in BottomTabBar
- **FlashList migration** — 8 long-list screens use `@shopify/flash-list` instead of ScrollView
- **Skeleton loading states** — per-screen skeletons sized to card height
- **Pull-to-refresh** with haptic feedback on all scrollable screens
- **Maestro E2E flows** — welcome, customer tab navigation, listing detail, merchant detail, merchant role switch, create listing, customer buy listing (end-to-end), run-all orchestrator
- **Preload critical data** after login (wallet, orders, profile/favorites)
- **i18n** — 147+ keys in EN + TH; pluralization for item counts and review counts; `Intl.DateTimeFormat` for dates/times

---

## Architecture Notes

- All data access goes through repository interfaces in `src/repositories/interfaces.ts`.
- `src/repositories/supabase.ts` is the live implementation (auth, users, merchants, listings, orders, wallet, payouts, coupons, messages, notifications, analytics) — this is what runs by default in this repo.
- `src/repositories/mock.ts` + `seed.ts` provide an in-memory fallback with realistic Thai seed data, for offline UI work with no backend.
- UI code never imports a backend client directly — both implementations satisfy the same interface, selected once in `src/repositories/index.ts` based on `EXPO_PUBLIC_REPOSITORY_MODE`.
- Auth tokens are persisted via `expo-secure-store` on native (`src/lib/supabase.ts`); web falls back to in-memory session only (no `SecureStore` on web).

---

## Known Limitations

- Camera / photo picker in create listing is simulated with placeholder URLs (web and Expo Go) — no `expo-image-picker` wiring yet.
- Push notifications are no-ops on web; native delivery goes through a Supabase Edge Function (`supabase/functions/`) + Expo Push Service — see [`docs/PUSH_NOTIFICATIONS.md`](docs/PUSH_NOTIFICATIONS.md).
- Native haptics are no-ops on web.
- `react-native-maps` requires native — web map falls back to a merchant list; see [`docs/GOOGLE_MAPS_SETUP.md`](docs/GOOGLE_MAPS_SETUP.md) for the cost-aware architecture.
- Real Google Maps API keys are committed in `app.json` — verify they're restricted (bundle ID / package + SHA-1 / HTTP referrer) in the Google Cloud Console rather than treating them as safe-to-ignore placeholders.
- `LogBox.ignoreAllLogs(true)` suppresses all RN warnings in development (see `app/_layout.tsx`) — worth narrowing before shipping if it's hiding real warnings.
- Jest unit/component coverage is a starting point (`src/lib/utils.test.ts`, `Button.test.tsx`, `Input.test.tsx`) — most of the app is only covered by Maestro E2E flows.
- Stripe Connect / PromptPay payments are not integrated — payouts screens exist but there's no live payment processor behind them yet.

---

## Everything here is up for change

Nothing in this repo — including the repository-pattern boundary, the mock/Supabase split, file locations, or any convention documented above — is fixed in stone. Refactor, rename, restructure, or replace any of it whenever it serves the app better; treat this file (and the others in the repo) as documentation of the current state, not a constraint on the next one.

---

## License

Private — see repository settings.
