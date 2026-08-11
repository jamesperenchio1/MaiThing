# Push Notifications — Maithing

Maithing uses **Expo Push Service** for real remote push notifications in Supabase mode. In mock mode, notifications are scheduled locally on the device.

## How it works

1. The app registers the device's Expo push token in Supabase (`push_tokens` table + `profiles.push_token`).
2. `useBackgroundNotifications` listens to Supabase Realtime events.
3. In Supabase mode, relevant events (order updates, merchant messages, restock alerts) call the `push-notify` Edge Function, which delivers the push via Expo.
4. In mock mode, only local notifications are scheduled.

## Setup

### 1. Expo access token

Generate an access token in the [Expo dashboard](https://expo.dev/settings/access-tokens) and set it as a Supabase secret:

```bash
supabase secrets set EXPO_ACCESS_TOKEN=<token> --project-ref <ref>
```

The Edge Function uses the token to authenticate requests to `https://exp.host/--/api/v2/push/send`.

### 2. Deploy the Edge Function

```bash
supabase functions deploy push-notify --project-ref <ref>
```

### 3. Client environment

Ensure the app is built in Supabase mode:

```bash
EXPO_PUBLIC_REPOSITORY_MODE=supabase
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Edge Function payload

`POST /functions/v1/push-notify`

```json
{
  "to": "ExponentPushToken[xxx]",
  "title": "Order Update",
  "body": "Your order is ready for pickup.",
  "data": { "orderId": "...", "type": "order_update" },
  "subtitle": "Optional subtitle",
  "sound": "default"
}
```

`to` may also be an array of tokens. Batches are split into chunks of 100 to match Expo's limits.

## Notes

- The function requires a valid `authorization` header (Supabase JWT).
- Web builds skip push token registration and remote push delivery.
- Push notifications are best-effort; failures are caught and ignored on the client.
