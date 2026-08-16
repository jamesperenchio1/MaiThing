# Google Maps Setup & Cost-Efficient Architecture

MaiThing uses Google Maps across native and web, but the architecture is deliberately optimized so the **biggest cost drivers are cached or avoided**.

## Cost overview (current Google Maps Platform pricing)

Google changed its pricing in March 2025: the old universal $200 monthly credit was replaced with **per-SKU free tiers**. The most relevant SKUs for this app are:

| Product                    | Free tier                | Paid rate        | How MaiThing uses it                                            |
| -------------------------- | ------------------------ | ---------------- | --------------------------------------------------------------- |
| Maps SDK for Android / iOS | Unlimited free map loads | Free             | Full interactive map tab + merchant detail map                  |
| Static Maps                | 10,000 loads/month       | $2 / 1,000 loads | Preview thumbnails (home card, merchant detail, listing detail) |
| Maps Embed API             | Unlimited free loads     | Free             | Optional interactive web map fallback                           |
| Dynamic Maps (JS API)      | 10,000 loads/month       | $7 / 1,000 loads | **Not used by default** — we avoid this SKU                     |

Sources: [Nicola Lazzari — Google Maps APIs guide](https://nicolalazzari.ai/articles/understanding-google-maps-apis-a-comprehensive-guide-to-uses-and-costs), [Google Cloud — Maps Platform pricing](https://cloud.google.com/maps-platform/pricing)

### What this means in practice

- **Native iOS/Android maps are free** at any reasonable scale because they use the mobile SDKs.
- **Static map previews cost money only when generated**, not when viewed. Each merchant location stores its static-map URL in `locations.static_map_url`, so listing-detail and merchant-detail previews are served from the DB without hitting Google again.
- **The home "shops near you" preview card** currently builds a fresh multi-marker Static Maps URL on each view. That is the only uncached Google Maps call in the happy path. It stays within the 10k free tier for moderate traffic; if you grow past that, switch the preview card to a cached nearest-merchant image or remove it.
- **Web interactive map** defaults to Leaflet + OpenStreetMap to avoid the Dynamic Maps SKU. If you want a Google-branded web map, use the Maps Embed API (free) or accept Dynamic Maps billing.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Native app (iOS/Android)                                   │
│  ├── Map tab, merchant detail map  →  Google Maps SDK       │
│  │                                      (free, unlimited)   │
│  └── Static previews               →  Cached DB URL first,  │
│                                       Google Static fallback│
├─────────────────────────────────────────────────────────────┤
│  Web app                                                    │
│  ├── Static previews               →  Cached DB URL first,  │
│  │                                       Google Static fallb│
│  └── Interactive map               →  Leaflet/OSM default   │
│                                       (Google Embed optional) │
├─────────────────────────────────────────────────────────────┤
│  Supabase                                                   │
│  └── locations.static_map_url      →  One Static Maps call  │
│                                       per location create/   │
│                                       update, then reused    │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-step setup

1. **Create or reuse a Google Cloud project**
   Go to [Google Cloud Console](https://console.cloud.google.com/) and create/select a project.

2. **Enable billing**
   Google requires a billing account even for free-tier usage. For native-only usage you should stay at $0, but billing must be enabled.

3. **Enable the required APIs**
   In **APIs & Services > Library**, enable:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Static Maps API
   - Maps Embed API (if you want the free web fallback)

4. **Create API keys**
   Go to **APIs & Services > Credentials > Create credentials > API key**.
   It is safest to create separate keys:
   - **iOS key** restricted to bundle ID `com.jamyangperenchio.maithing`
   - **Android key** restricted to package `com.jamyangperenchio.maithing` + your SHA-1 fingerprint
   - **Web key** restricted to your web domain(s) via HTTP referrer

5. **Restrict each key**
   - iOS/Android keys: restrict to the correct app and limit APIs to **Maps SDK for Android / iOS**.
   - Web key: restrict by HTTP referrer and limit APIs to **Static Maps API** and **Maps Embed API**.
     Do **not** use one unrestricted key for everything.

6. **Set budget alerts (safeguard)**
   Google Cloud does not support a true hard spending cap. Set a low budget alert in **Billing > Budgets & alerts** (e.g. $5 or $10) at 50%, 90%, and 100% so you get early warning if a key leaks or an unexpected SKU is triggered.

7. **Replace the keys in `app.json`**

   ```json
   [
     "react-native-maps",
     {
       "androidGoogleMapsApiKey": "YOUR_ANDROID_KEY",
       "iosGoogleMapsApiKey": "YOUR_IOS_KEY"
     }
   ]
   ```

   The web implementation reads the Android key as a fallback. For production web builds, store the web key in an environment variable and inject it at build time rather than committing it.

8. **Rebuild native apps**
   Run `pnpm ios` or `pnpm android` so the new keys are baked into the native config.

## Troubleshooting

- **Blank map on iOS/Android:** missing key, Maps SDK not enabled, wrong bundle/package restriction, or billing not enabled.
- **Static map image does not load on web:** the key is probably restricted to Android/iOS apps only. Use a separate browser key with HTTP referrer restriction.
- **Costs spike:** check the Google Cloud Billing dashboard for which SKU is being consumed. The most likely culprits are uncached Static Maps previews or accidentally enabling Dynamic Maps.
