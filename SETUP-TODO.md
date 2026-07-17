# SETUP-TODO — Human-Only Credential Steps

These items require a human to complete. Nothing else blocks running the app.

## Required Before Running

### 1. Supabase Service Role Key
- Go to: https://supabase.com/dashboard/project/bvvsuollejcndcjjveal/settings/api
- Copy the `service_role` secret key (starts with `sb_secret_...` or `eyJ...`)
- Set in `CLAUDE.md` under `SUPABASE_SERVICE_ROLE_KEY`
- Required for: Edge Functions, admin operations, webhook handler

### 2. Supabase DB Password
- Same page as above
- Required for: `supabase link`, `supabase db push`, direct DB access

### 3. Apply Schema Migration
Once you have the DB password:
```bash
supabase link --project-ref bvvsuollejcndcjjveal
supabase db push
```
Then run the seed:
```bash
supabase db seed --linked
```
Then regenerate types:
```bash
supabase gen types typescript --project-id bvvsuollejcndcjjveal \
  > packages/shared/src/types/supabase.ts
```

### 4. Stripe Webhook Secret
- Go to: https://dashboard.stripe.com/test/webhooks
- Add endpoint: `https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook`
- Copy the signing secret (`whsec_...`)
- Set `STRIPE_WEBHOOK_SECRET` in `CLAUDE.md`

## Recommended (stubs in place until provided)

### 5. Google Maps API Key
- https://console.cloud.google.com → APIs & Services → Credentials
- Enable: Maps SDK for iOS, Maps SDK for Android, Maps JavaScript API
- Set: `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`
- Without this: map renders in placeholder mode

### 6. Google OAuth
- https://console.cloud.google.com → OAuth 2.0 Client IDs
- Set: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
- Configure in Supabase Auth → Providers → Google
- Without this: Google sign-in button is hidden

### 7. LINE Login
- https://developers.line.biz → Create channel → LINE Login
- Set: `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`
- Configure in Supabase Auth → Providers → LINE (custom OIDC)
- Without this: LINE sign-in button is hidden

### 8. Resend (Email)
- https://resend.com → API Keys
- Set: `RESEND_API_KEY`
- Without this: transactional emails are logged but not sent

### 9. PostHog
- https://app.posthog.com → Project Settings → API Keys
- Set: `POSTHOG_API_KEY`
- Without this: analytics events are no-ops

### 10. Sentry
- https://sentry.io → Project → Settings → Client Keys
- Set: `SENTRY_DSN_CONSUMER`, `SENTRY_DSN_ADMIN`
- Without this: errors are console.warn only

### 11. Expo / EAS
- `npx eas login` (free Expo account)
- `npx eas init` inside `apps/consumer/`
- Copy the project ID into `apps/consumer/app.json` under `extra.eas.projectId`
- Required for: native device builds, push notifications on device

## Not Needed for MVP

- Apple Developer Account ($99/yr) — only for App Store submission
- Google Play Account ($25) — only for Play Store submission
