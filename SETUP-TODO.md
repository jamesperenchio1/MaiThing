# SETUP-TODO — Human-Only Credential Steps

These items require a human to complete. Nothing else blocks running the app.

## Completed (this environment)

- Supabase project linked (`bvvsuollejcndcjjveal`) and migrations applied.
- Supabase Edge Function secrets set: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.
- Stripe test secret key set as a Supabase Edge Function secret and in `apps/admin/.env`.
- Stripe webhook endpoint created and `STRIPE_WEBHOOK_SECRET` set in Supabase secrets + `apps/admin/.env`.
- Seed users created: `admin@maithing.test`, `owner@maithing.test`, `buyer@maithing.test` (password `TestPassword123!`).

## Recommended (stubs in place until provided)

### 1. Google Maps API Key
- https://console.cloud.google.com → APIs & Services → Credentials
- Enable: Maps SDK for iOS, Maps SDK for Android, Maps JavaScript API
- Set: `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` in `apps/consumer/.env`
- Without this: map renders in placeholder mode

### 2. Google OAuth
- https://console.cloud.google.com → OAuth 2.0 Client IDs
- Set: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` in `apps/admin/.env` and `apps/consumer/.env`
- Configure in Supabase Auth → Providers → Google
- Without this: Google sign-in button is hidden

### 3. LINE Login
- https://developers.line.biz → Create channel → LINE Login
- Set: `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` in both `.env` files
- Configure in Supabase Auth → Providers → LINE (custom OIDC)
- Without this: LINE sign-in button is hidden

### 4. Resend (Email)
- https://resend.com → API Keys
- Set: `RESEND_API_KEY` in both `.env` files
- Without this: transactional emails are logged but not sent

### 5. PostHog
- https://app.posthog.com → Project Settings → API Keys
- Set: `EXPO_PUBLIC_POSTHOG_API_KEY`, `NEXT_PUBLIC_POSTHOG_API_KEY` in `.env` files
- Without this: analytics events are no-ops

### 6. Sentry
- https://sentry.io → Project → Settings → Client Keys
- Set: `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_DSN_ADMIN` in `.env` files
- Without this: errors are console.warn only

### 7. Expo / EAS
- `npx eas login` (free Expo account)
- `npx eas init` inside `apps/consumer/`
- Copy the project ID into `apps/consumer/app.json` under `extra.eas.projectId`
- Required for: native device builds, push notifications on device

## Not Needed for MVP

- Apple Developer Account ($99/yr) — only for App Store submission
- Google Play Account ($25) — only for Play Store submission

## Known Limitations

- **Consumer web preview** is currently broken due to a duplicate React runtime issue in the Metro bundle when using `pnpm` + `expo-router` web. The native iOS/Android build (Expo Go / EAS) is the primary target and is unaffected. See `PROGRESS.md` and `DECISIONS.md`.
