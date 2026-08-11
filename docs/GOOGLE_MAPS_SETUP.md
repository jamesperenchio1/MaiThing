# Google Maps Setup & $1 Spending Safeguard

Maithing uses Google Maps on both iOS and Android for the native map views.

## Why native-only keeps cost at $0

Google's Maps SDK for Android and Maps SDK for iOS are **free of charge for unlimited map loads** under the standard Google Cloud pricing. This means the native iOS and Android maps in this project cost **$0/month** at typical usage levels.

The cost concern only appears if you enable the **Maps JavaScript API** for the web build. That API is billed at roughly **$7 per 1,000 map loads** after the monthly free tier. The web map files in this project (`Map.web.tsx`, `MerchantMap.web.tsx`, `StaticMap.web.tsx`, `LeafletMap.tsx`) use Leaflet instead of Google Maps, so the Google JS API is not loaded unless you deliberately switch the web implementation.

## Step-by-step setup

1. **Create or reuse a Google Cloud project**
   Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project, or select an existing one.

2. **Enable billing**
   Google requires a billing account to use Maps SDKs, but for native-only usage you should not incur charges. Add a payment method in **Billing**.

3. **Enable the required APIs**
   In **APIs & Services > Library**, enable:
   - Maps SDK for Android
   - Maps SDK for iOS

4. **Create an API key**
   Go to **APIs & Services > Credentials > Create credentials > API key**.

5. **Restrict the key**
   - Under **Application restrictions**, choose **Android apps** and add your package name (`com.jamyangperenchio.maithing`) and SHA-1 certificate fingerprint.
   - Add an **iOS apps** restriction and enter the bundle ID (`com.jamyangperenchio.maithing`).
   - Under **API restrictions**, limit the key to **Maps SDK for Android** and **Maps SDK for iOS** only.

6. **Set a $1 billing alert (safeguard)**
   Google Cloud does **not** support a true hard spending cap. The practical safeguard is a budget alert:
   - Go to **Billing > Budgets & alerts**.
   - Create a budget with a **$1 monthly threshold**.
   - Set email alerts at 50%, 90%, and 100%.
   - This gives you early warning if a key is leaked or an unexpected API is enabled, but it will not automatically stop usage.

7. **Replace the placeholder key in `app.json`**
   Replace both placeholder values with your real API key:

   ```json
   [
     "react-native-maps",
     {
       "androidGoogleMapsApiKey": "YOUR_REAL_API_KEY",
       "iosGoogleMapsApiKey": "YOUR_REAL_API_KEY"
     }
   ]
   ```

   Then rebuild the native apps with `pnpm ios` or `pnpm android`.

## Monthly cost estimate

- **Native only (iOS + Android Maps SDKs):** $0
- **If you later enable Maps JavaScript API on web:** ~$7 per 1,000 loads after the free tier

## Troubleshooting

- **Blank map on iOS or Android:** usually means the API key is missing, the Maps SDK is not enabled, the key is restricted to the wrong bundle/package, or billing is not enabled.
- **iOS-specific blank map:** make sure `iosGoogleMapsApiKey` is set in `app.json` and the bundle ID restriction matches `com.jamyangperenchio.maithing`.
- **Android-specific blank map:** verify the package name and SHA-1 fingerprint in the Android key restriction.
