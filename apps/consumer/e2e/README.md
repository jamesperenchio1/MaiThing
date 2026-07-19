# Maestro E2E flows — consumer app

These flows describe the core loop. They require a running Expo dev server
(`pnpm --filter consumer start`) and the Maestro CLI installed.

Because the flows exercise the real Supabase backend and Stripe test mode, they
are expected to run against a seeded dev project with test credentials.

## Flows

- `discover-and-reserve.yaml` — open app, grant location, view map/list, tap a
  listing, select slot, reserve and pay in Stripe test mode, see pickup code.
- `merchant-collect.yaml` — sign in as merchant, open today view, tap an order,
  confirm collection by code, see order status change to collected.
- `buyer-review.yaml` — as a buyer, open a collected order, rate value + quality,
  submit review.

## Run

```bash
maestro test apps/consumer/e2e/discover-and-reserve.yaml
maestro test apps/consumer/e2e/merchant-collect.yaml
maestro test apps/consumer/e2e/buyer-review.yaml
```

## Credentials

Set these environment variables before running:

- `MAESTRO_SUPABASE_URL`
- `MAESTRO_SUPABASE_ANON_KEY`
- `MAESTRO_BUYER_EMAIL` / `MAESTRO_BUYER_PASSWORD`
- `MAESTRO_MERCHANT_EMAIL` / `MAESTRO_MERCHANT_PASSWORD`
