# ScanMate

React Native (Expo) app for scanning, cropping, compressing, and syncing PDFs with Supabase, VisionCamera, AdMob, and RevenueCat.

## Prerequisites
- Node 18+ (CI uses Node 20)
- Expo CLI / EAS CLI
- Supabase project + CLI
- RevenueCat project (entitlement id `pro`)
- AdMob accounts (test IDs used by default)

## Setup
```bash
npm install
npm run lint
npm run typecheck
```

### Env vars (`app.config.ts` or `.env`)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_RC_API_KEY`
- `EXPO_PUBLIC_RC_ENTITLEMENT_ID` (default `pro`)
- `EXPO_PUBLIC_ADMOB_BANNER_ID`, `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID`, `EXPO_PUBLIC_ADMOB_REWARDED_ID` (test IDs fallback)

### Run
```bash
eas build --profile development --platform ios|android   # custom dev client for VisionCamera
expo start                                               # after installing dev client on device
```

## Features
- VisionCamera capture with edge overlay
- Crop + filters (expo-image-manipulator)
- PDF assembly (pdf-lib), thumbnails, compression flow
- Local storage (raw/processed) + MMKV cache
- Supabase sync scaffolding + Edge Functions stubs
- Ads (AdMob) with gating, Subscriptions (RevenueCat) with Pro/Ad-free
- Settings, empty/error states, skeletons

## Backend
- SQL schema: `backend/supabase/schema.sql`
- Edge functions: `edge-functions/compress-pdf`, `generate-thumbnail`, `cleanup-temp`
- Supabase deploy workflow: `.github/workflows/supabase-deploy.yml` (requires `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` secrets)

## CI/CD
- GitHub Actions: `.github/workflows/ci.yml` (lint + typecheck + placeholder tests)
- EAS config: `eas.json` (dev client, preview, production)

## Notable scripts
- `npm run lint`
- `npm run typecheck`
- `npm run lint:fix`

## TODO / Production hardening
- Implement real upload/download in sync queue
- Wire compress/thumbnail edge functions to storage
- Add tests and viewer flows
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
