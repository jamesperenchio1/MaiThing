# Expo Web → Expo Go Handoff Checklist

## What was verified on Expo Web (`npx expo export --platform web`)

- [x] Project initializes with latest Expo SDK 57 / React 19 / RN 0.86
- [x] TypeScript strict mode passes (`npx tsc --noEmit`)
- [x] ESLint passes (`npx eslint . --ext .ts,.tsx`)
- [x] NativeWind 4 + Tailwind CSS 3 compiles and bundles
- [x] Web export succeeds with 56 static routes
- [x] Welcome / onboarding screen renders
- [x] "Continue as Test Customer" flow works
- [x] "Continue as Test Merchant" flow works
- [x] Customer home loads with seeded merchants, categories, and listings
- [x] Discover search + filters render
- [x] Listing cards and merchant cards render
- [x] Listing detail screen renders
- [x] Merchant detail screen renders
- [x] Orders screen renders with active/history tabs
- [x] Wallet screen renders with balance and transactions
- [x] Profile screen renders with language + dark-mode toggles
- [x] Merchant dashboard renders with analytics
- [x] Merchant inventory renders
- [x] Create listing form renders and validates with Zod
- [x] Merchant orders screen renders
- [x] Dark mode classes are applied
- [x] Thai/English i18n strings are wired

## What needs verification on Expo Go (physical device)

- [ ] Native splash screen and custom font loading
- [ ] Native tab bar haptics and transitions
- [ ] `react-native-maps` native map rendering, pins, user location
- [ ] `expo-image` native placeholders and caching
- [ ] `expo-haptics` impact feedback on buttons
- [ ] Push notifications (`expo-notifications`) permissions and display
- [ ] Camera / photo picker in create listing (currently simulated with placeholder)
- [ ] Deep linking from notifications
- [ ] 60 FPS scroll with FlashList (currently using ScrollView on some screens)
- [ ] Biometric/secure token storage with `expo-secure-store`
- [ ] MMKV preference caching (currently using AsyncStorage for web parity)
- [ ] Large text / accessibility scaling
- [ ] VoiceOver screen-reader labels

## How to run on your phone

```bash
cd /Users/jamesperenchio/Desktop/maithing
npx expo start
# Scan the QR code with the Expo Go app
# If your phone is not on the same network, run: npx expo start --tunnel
```

## Known Web Limitations

- Map screen falls back to a merchant list on web because `react-native-maps` requires native.
- Photo upload in create listing is simulated with placeholder URLs on web.
- Native haptics are no-ops on web.
- Push notifications are mocked on web.

## Next Steps for Production

1. Replace placeholder image URLs with real photo upload flow (`expo-image-picker`).
2. Implement Supabase repositories and real auth.
3. Add Google/Apple OAuth and LINE login.
4. Integrate Stripe Connect for merchant payouts and PromptPay/card payments.
5. Add real-time order updates via Supabase Realtime.
6. Build native map clusters and directions.
7. Add comprehensive E2E tests with Maestro or Detox.
