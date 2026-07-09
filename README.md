# RN Starter

A premium React Native / Expo monorepo boilerplate with production-grade monetization, i18n, theming, push notifications, and a Cloudflare Workers API — ready to customize into your next app.

---

## Features

- **Theme system** — light / dark mode with RTL support (Arabic and any RTL language)
- **i18n** — 20 languages (EN, FR, ES, DE, PT-BR, ZH-CN, ZH-TW, JA, KO, AR, HI, BN, RU, ID, TR, IT, NL, SV, PL, VI), lazy-loaded
- **RevenueCat paywall** — monthly + annual subscriptions, 7-day free trial, grace period banner
- **Contextual paywall** — triggers on generic action count (`engagementStorage.getActionCount / incrementAction`) and session signals — no business logic baked in
- **AdMob** — banner (per-screen), interstitial, rewarded with configurable ad-free window
- **Firebase Analytics + Crashlytics** — typed wrapper, ready to track custom events
- **Push notifications** — FCM + `expo-notifications`; scheduled local reminders via `expo-notifications` trigger API
- **App-store rating prompt** — `expo-store-review` with store URL fallback
- **Onboarding flow** — welcome → premium value pitch → language picker
- **2-tab navigation** — Home (premium demo) + Settings; Expo Router file-based
- **Custom tab bar** — blur effect, haptics, premium-aware
- **Cloudflare Workers API** — Hono, API-key auth, rate limiter, FCM push service, `/health` + `/example`
- **Shared types** — `packages/shared` consumed by both mobile and API

---

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| Expo | ~54.0.23 | React Native platform |
| React | 19.1.0 | UI |
| React Native | 0.81.5 | Native framework |
| Expo Router | ~6.0.14 | File-based navigation |
| NativeWind | ^4.2.1 | Tailwind CSS for React Native |
| Zustand | ^5.0.8 | State management (with `persist` + MMKV) |
| TanStack Query | ^5.100.8 | Server state, persisted via MMKV |
| react-native-mmkv | ^3.3.3 | Synchronous local storage |
| i18next / react-i18next | ^25 / ^16 | Internationalization |
| react-native-reanimated | ~4.1.1 | Animations |
| Moti | ^0.30.0 | Declarative animations |
| @react-native-firebase | ^24.0.0 | Analytics, Crashlytics, FCM |
| react-native-google-mobile-ads | ^15.5.0 | AdMob |
| react-native-purchases | ^10.0.1 | RevenueCat IAP |
| expo-notifications | latest | Push + local notifications |
| expo-store-review | ^55.0.13 | In-app rating |
| Hono | ^4 | API framework (Cloudflare Workers) |
| TypeScript | 5.x | Strict typing throughout |
| pnpm workspaces + Turborepo | — | Monorepo tooling |

---

## Monorepo Structure

```
rn-starter/
├── apps/
│   ├── mobile/          # Expo SDK 54 / React Native app (iOS + Android)
│   └── api/             # Cloudflare Workers API (Hono)
├── packages/
│   └── shared/          # Shared TypeScript types (HealthResponse, ApiErrorResponse)
├── scripts/
│   └── setup.sh         # Interactive setup script — personalizes the template
└── turbo.json
```

### Mobile app layout

```
apps/mobile/
├── app/
│   ├── _layout.tsx      # Root layout — providers + tab navigator
│   ├── index.tsx        # Home tab (premium demo)
│   └── settings.tsx     # Settings tab
├── components/          # ads/, alerts/, layout/, onboarding/, paywall/, settings/, ui/
├── constants/           # admob, config, legal, rating
├── hooks/               # usePremium, useTabBarPadding, useThemedColor, ...
├── i18n/                # service.ts + languages/ (20 JSON files)
├── providers/           # AdFreeProvider, AlertNotificationProvider, QueryProvider,
│                        #   SubscriptionProvider, ThemeProvider, ToastProvider
├── services/
│   ├── api/             # adService, analyticsService, contextualPaywall/,
│   │                    #   crashlyticsService, engagementService, purchaseService,
│   │                    #   ratingService, rewardedAdService
│   ├── notifications/   # setup, channels, payload, scheduleAlert, backgroundHandler
│   ├── promo/           # promoCoordinator (anti-stacking authority)
│   └── storage/         # mmkv, adapter, keys, domains/
├── stores/              # alertsStore, deepLinkStore, onboardingStore, settingsStore
└── types/               # app-wide TypeScript types
```

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/your-org/rn-starter.git
cd rn-starter
```

### 2. Run the setup script

The interactive setup script personalizes the template (app name, bundle ID, scheme) and copies the example secret files:

```bash
bash scripts/setup.sh
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Add Firebase and secret files

**Mobile:**

```bash
# Add your real google-services.json (Android Firebase)
cp apps/mobile/google-services.json.example apps/mobile/google-services.json
# Edit apps/mobile/google-services.json with your Firebase project values

# Add your real GoogleService-Info.plist (iOS Firebase) — no example provided,
# download it from the Firebase Console and place it at:
# apps/mobile/GoogleService-Info.plist

# Fill in your real .env values
# (setup.sh creates apps/mobile/.env from .env.example if absent)
```

**API:**

```bash
# Fill in your real .dev.vars values
# (setup.sh creates apps/api/.dev.vars from .dev.vars.example if absent)
```

### 5. Start the dev server

```bash
pnpm dev:mobile     # Expo dev server
pnpm dev:api        # Cloudflare Worker local dev
```

---

## Native Build (Continuous Native Generation)

The native `ios/` and `android/` folders are not committed — they are fully regenerated by Expo CNG:

```bash
# Generate both platforms
pnpm --filter mobile preb

# Or per platform
pnpm --filter mobile preb:android
pnpm --filter mobile preb:ios
```

After prebuild, use:

```bash
pnpm android   # expo run:android
pnpm ios       # expo run:ios
```

---

## Commands

All commands run from the repo root unless noted.

| Command | Description |
|---|---|
| `pnpm dev` | Turbo dev (all workspaces) |
| `pnpm dev:mobile` | Expo dev server only |
| `pnpm dev:api` | Cloudflare Worker local dev |
| `pnpm android` | `expo run:android` |
| `pnpm ios` | `expo run:ios` |
| `pnpm build` | Turbo build |
| `pnpm typecheck` | TypeScript check (all workspaces) |
| `pnpm lint` | ESLint (all workspaces) |
| `pnpm deploy:api` | `wrangler deploy` |
| `pnpm --filter mobile preb` | `expo prebuild` (generate native projects) |

---

## Configuration

### Environment variables — mobile (`apps/mobile/.env`)

See `apps/mobile/.env.example` for all keys with comments. Key groups:

- **ADMOB_*** — AdMob app IDs and ad unit IDs (banner / interstitial / rewarded per platform)
- **REVENUECAT_*** — API keys, entitlement ID, product IDs
- **BACKEND_URL / BACKEND_API_KEY** — points to your deployed Cloudflare Worker
- **GOOGLE_WEB_CLIENT_ID** — OAuth 2.0 Web Client ID (Google Sign-In)
- **LEGAL_*** — privacy policy, terms, licenses, support email URLs
- **STORE_URL_*** — App Store and Play Store URLs for rating fallback

### Environment variables — API (`apps/api/.dev.vars`)

See `apps/api/.dev.vars.example` for all keys. For production, set these as Cloudflare Worker secrets:

```bash
wrangler secret put API_KEY
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
```

### Firebase config files

| File | Purpose |
|---|---|
| `apps/mobile/google-services.json` | Android Firebase (gitignored — use `.example` as template) |
| `apps/mobile/GoogleService-Info.plist` | iOS Firebase (gitignored — download from Firebase Console) |

---

## License

MIT
