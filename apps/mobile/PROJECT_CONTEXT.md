# RN Starter — Mobile App Context

Concise reference for the generic starter's architecture as it actually exists.
Keep this in sync with CLAUDE.md and the code — update both as part of any change.

---

## Overview

- **Bundle ID placeholder:** `com.yourcompany.rnstarter`
- **Monorepo:** `apps/mobile/` (this app), `apps/api/` (Cloudflare Worker), `packages/shared/`
- **Version:** computed in `app.config.js` — `major*10000 + minor*100 + patch`

---

## Provider Tree

Composition in `app/_layout.tsx` (outer -> inner):

```
SafeAreaProvider
  > RootLayoutContent          <- runs storage migration before anything
      TelemetryEffects         <- side-effect only, no children
      GestureHandlerRootView
        > QueryProvider        <- TanStack Query (PersistQueryClientProvider + MMKV)
          > ThemeProvider      <- light/dark via NativeWind 'class' strategy
            > ToastProvider    <- toast stack (ModalToastViewport for modals)
              > SubscriptionProvider   <- RevenueCat, grace period, PostPurchaseModal
                > AdFreeProvider       <- ad-free session window tracking
                  > AlertNotificationProvider  <- foreground banners + deep-link nav
                    > AppContent       <- onboarding gate, then TabLayout
      RTLRestartBanner         <- outside provider tree
```

`RootLayoutContent` runs `runStorageMigration()` (AsyncStorage -> MMKV) then forces `persist.rehydrate()` on Zustand stores if migration just ran.

---

## Screens

| Route | File | Description |
|---|---|---|
| `/(tabs)/index` | `app/index.tsx` | Home — premium feature showcase, paywall CTA |
| `/(tabs)/settings` | `app/settings.tsx` | Settings — theme, language, premium, ads, alerts, legal |
| Onboarding | `components/onboarding/OnboardingScreen.tsx` | 3-step flow: welcome → premium value → language picker |
| Paywall modal | `components/paywall/PaywallModal.tsx` | RevenueCat purchase sheet |

---

## Stores

All stores in `apps/mobile/stores/`. Persisted stores use Zustand `persist` + MMKV via `mmkvStateStorage`.

| Store | Persisted | Description |
|---|---|---|
| `settingsStore` | Yes | User preferences (theme, language), RTL restart state |
| `onboardingStore` | Yes | Onboarding completion, current step, persona, pro welcome seen |
| `alertsStore` | Yes | Scheduled local notification alerts (local-only, no backend) |
| `deepLinkStore` | No | Holds a pending alert deep-link until consumed by `AlertNotificationProvider` |

---

## Services

### `services/api/`

| Service | Description |
|---|---|
| `adService.ts` | AdMob interstitial — lazy-init, disabled when premium/ad-free |
| `rewardedAdService.ts` | AdMob rewarded — lazy-init, grants ad-free window on completion |
| `analyticsService.ts` | Firebase Analytics typed wrapper (`track`, `setUserProperty`, `init`) |
| `crashlyticsService.ts` | Firebase Crashlytics (`recordError`) |
| `engagementService.ts` | Session init (install date, session count); paywall counter; exposes `getPaywallContext` |
| `purchaseService.ts` | RevenueCat — `getOfferings`, `purchasePackage`, `restorePurchases` |
| `ratingService.ts` | `expo-store-review` with platform store URL fallback |
| `contextualPaywall/` | `index.ts` (service: `evaluate`, `resetSession`, `recordShown`) + `policy.ts` (pure evaluation) |

### `services/notifications/`

| File | Description |
|---|---|
| `setup.ts` | `notificationService` — permission request, foreground handler, tap listener |
| `channels.ts` | Android notification channels (`ALERTS_CHANNEL_ID`, `RATE_ALERTS_CHANNEL_ID`) |
| `payload.ts` | `parseAlertPayload` — typed notification data extraction |
| `scheduleAlert.ts` | `scheduleAlertNotification` / `cancelAlertNotification` — local DATE-triggered reminders |
| `backgroundHandler.ts` | Registered at entry point (`index.js`) for background FCM handling |

### `services/promo/`

`promoCoordinator.ts` — single in-memory authority over interruptive promotional surfaces.
Enforces no stacking (`isSurfaceVisible`) and one automatic promo per session (`canPresentAutoPromo` / `markAutoPromoShown`). Reset at boot via `contextualPaywallService.resetSession()`.

### `services/storage/`

| File/Dir | Description |
|---|---|
| `mmkv.ts` | Single MMKV instance |
| `adapter.ts` | Sync `StateStorage` adapter for Zustand `persist` |
| `keys.ts` | All MMKV key constants (`KEYS`) |
| `migration.ts` | One-shot AsyncStorage -> MMKV (idempotent) |
| `domains/adFree.ts` | Ad-free window expiry |
| `domains/ads.ts` | Ad-cadence state (interstitial / rewarded cooldowns) |
| `domains/engagement.ts` | Session count, install date, paywall counter, **generic action counter** (`getActionCount` / `incrementAction` / `resetActionCount`) |
| `domains/rating.ts` | Rating prompt eligibility |
| `domains/subscription.ts` | Subscription expiry + lifetime flag; `derive(now, gracePeriodMs)` |
| `domains/userSettings.ts` | Typed reader for user settings outside Zustand (used by notification handler) |

---

## Monetization

### AdMob

Banner ads per screen (`AdBanner`), interstitial via `adService`, rewarded via `rewardedAdService`. All ad surfaces check premium status and ad-free window before showing. Configured via `constants/admob.ts` which reads from `.env`.

### RevenueCat

`SubscriptionProvider` wraps `Purchases` SDK. `usePremium()` hook exposes `isPremium`, `isInitialized`, `openPaywall({ source })`. Grace period: `subscriptionStorage.derive(now, gracePeriodMs)` grants continued access after expiry; `SubscriptionGraceBanner` warns user.

### Contextual Paywall

`contextualPaywallService.evaluate(...)` uses:
- `engagementStorage.getSessionCount()` — for `session_return` arming
- `engagementStorage.getActionCount()` — for `power_action` / `after_n_actions` triggers

**To hook your app's actions into the contextual paywall:** call `engagementStorage.incrementAction()` on any meaningful user interaction (e.g. completing a feature action). The paywall policy in `contextualPaywall/policy.ts` will trigger at the configured thresholds.

---

## Navigation

Expo Router file-based. Two tabs rendered by `TabLayout`:
1. `index` — Home screen
2. `settings` — Settings screen (lazy)

`PremiumTabBar` renders tab icons with blur background and haptic feedback.

`AppContent` gates the tabs behind onboarding: shows `OnboardingScreen` until `onboardingStore.isCompleted` is true.

---

## Onboarding

3-step flow in `OnboardingScreen.tsx`:
1. `WelcomeStep` — app introduction
2. `PremiumValueStep` — premium pitch (triggers paywall/trial)
3. `LanguageStep` — language selection

After completion, `onboardingStore.markCompleted()` is called and `AppContent` renders the tabs.

---

## i18n

20 languages: en, fr, es, de, pt-BR, zh-CN, zh-TW, ja, ko, ar, hi, bn, ru, id, tr, it, nl, sv, pl, vi. Lazy-loaded JSON files in `i18n/languages/`. RTL for `ar` triggers `I18nManager.forceRTL` + restart (gated by `RTL_RESTART_BANNER_ENABLED`).

**Translation policy:** EN + FR are the source of truth. Other languages are updated in dedicated sessions, never mixed with feature work.

---

## Data Fetching

TanStack Query v5 for server state. `QueryProvider` uses `PersistQueryClientProvider` + MMKV persister. Cache buster = app version.

---

## Styling

NativeWind v4, dark mode via `'class'` strategy. Reanimated 4 + Moti for animations. `GradientButton` for primary CTAs. `ToastProvider` for feedback; mount `ModalToastViewport` inside modals to surface toasts over them.

---

## Path Aliases

`@/*`, `@components/*`, `@services/*`, `@stores/*`, `@hooks/*`, `@utils/*`, `@constants/*`, `@types/*`, `@i18n/*`, `@assets/*`. No `@providers/*` alias — use `@/providers/*`.
