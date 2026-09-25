# RN Starter — Mobile App Context

Concise reference for the generic starter's architecture as it actually exists.
Keep this in sync with CLAUDE.md and the code — update both as part of any change.

---

## Overview

- **Bundle ID placeholder:** `com.yourcompany.rnstarter`
- **Monorepo:** `apps/mobile/` (this app), `apps/api/` (Cloudflare Worker), `packages/shared/`
- **Version:** `versionCode` computed in `app.config.js` — `major*1000000 + minor*1000 + patch`. Base 1000 per field, so the code stays strictly increasing up to `x.999.999`; Play only ever accepts a higher code than the last upload.

---

## Provider Tree

Composition in `app/_layout.tsx` (outer -> inner):

```
SafeAreaProvider
  > RootLayoutContent
      TelemetryEffects         <- side-effect only, no children
      GestureHandlerRootView
        > QueryProvider        <- TanStack Query (PersistQueryClientProvider + MMKV, persists nothing by default)
          > ThemeProvider      <- light/dark via NativeWind 'class' strategy
            > ToastProvider    <- toast stack (ModalToastViewport for modals)
              > SubscriptionProvider   <- RevenueCat, offline allowance, PostPurchaseModal
                > AdFreeProvider       <- ad-free session window tracking
                  > AppContent         <- onboarding gate, then TabLayout
      RTLRestartBanner         <- outside provider tree
```

Persisted Zustand stores hydrate synchronously from MMKV (`mmkvStateStorage`) at module import, so `RootLayoutContent` renders the provider tree directly with no async boot gate.

---

## Screens

| Route | File | Description |
|---|---|---|
| `/(tabs)/index` | `app/index.tsx` | Home — premium feature showcase, paywall CTA |
| `/(tabs)/settings` | `app/settings.tsx` | Settings — theme, language, premium, ads, legal |
| Onboarding | `components/onboarding/OnboardingScreen.tsx` | 2-step flow: welcome → premium value (welcome has a top-left language selector) |
| Paywall modal | `components/paywall/PaywallModal.tsx` | RevenueCat purchase sheet |

---

## Stores

All stores in `apps/mobile/stores/`. Persisted stores use Zustand `persist` + MMKV via `mmkvStateStorage`.

| Store | Persisted | Description |
|---|---|---|
| `settingsStore` | Yes | User preferences (theme, language), RTL restart state |
| `onboardingStore` | Yes | Onboarding completion, current step, persona, pro welcome seen |

---

## Services

### `services/api/`

| Service | Description |
|---|---|
| `adService.ts` | AdMob interstitial — lazy-init, disabled when premium/ad-free; `setPremium` (written only by `SubscriptionProvider`) disarms a preloaded ad the moment Pro is bought. `showInterstitialAd()` resolves `true` only once the ad has closed, and only then spends the cadence and the session's interruption |
| `rewardedAdService.ts` | AdMob rewarded — lazy-init, grants ad-free window on completion; `showRewardedAd` resolves `earned` / `dismissed` / `failed`, and only a dismissal is followed by the contextual paywall |
| `fullScreenAd.ts` | `presentFullScreenAd` — settles an interstitial or rewarded ad once it is gone (`CLOSED` / `ERROR`, or no `OPENED` within `PRESENTATION_TIMEOUT_MS`); `onEnd` runs whenever the presentation really ends, so an ad that opens late still pays its slot or its reward |
| `analyticsService.ts` | Firebase Analytics typed wrapper (`track`, `setUserProperty`, `init`) |
| `crashlyticsService.ts` | Firebase Crashlytics (`recordError`) |
| `engagementService.ts` | Session init (install date, session count); paywall counter; exposes `getPaywallContext` |
| `purchaseService.ts` | RevenueCat — `getOfferings`, `purchasePackage`, `restorePurchases` |
| `consentService.ts` | Google UMP consent gate; only caller of `mobileAds().initialize()` |
| `ratingService.ts` | `requestNativeReview()` (auto flows only) / `openStoreListing({ reason })` (taps, fallbacks) |
| `contextualPaywall/` | `index.ts` (service: `evaluate`, `resetSession`, `recordShown`) + `policy.ts` (pure evaluation) |

### `services/notifications/`

| File | Description |
|---|---|
| `setup.ts` | `notificationService` — permission request/primer, foreground presentation handler |
| `channels.ts` | Android notification channel setup (`ensureNotificationChannels`, `NOTIFICATION_CHANNEL_ID`) |

### `services/promo/`

`promoCoordinator.ts` — single in-memory authority over interruptive surfaces: the paywall and the AdMob interstitial (`PromoSurface`).
Enforces no stacking (`isSurfaceVisible`) and one automatic interruption per session, all types included (`canPresentAutoPromo` / `markAutoPromoShown`). A paywall the user opens registers its visibility but spends no budget. Reset at boot via `contextualPaywallService.resetSession()`.

### `services/storage/`

| File/Dir | Description |
|---|---|
| `mmkv.ts` | Single MMKV instance |
| `adapter.ts` | Sync `StateStorage` adapter for Zustand `persist` |
| `keys.ts` | All MMKV key constants (`KEYS`) |
| `domains/adFree.ts` | Ad-free window expiry — a new reward adds to what is left, capped at `AD_REWARDED_FREE_MAX_MINUTES` |
| `domains/ads.ts` | Ad-cadence state (interstitial / rewarded cooldowns) |
| `domains/engagement.ts` | Session count, install date, paywall counter, **generic action counter** (`getActionCount` / `incrementAction`) — never reset |
| `domains/rating.ts` | Rating prompt eligibility; `hasRated` is a read-only legacy gate |
| `domains/subscription.ts` | Subscription expiry + lifetime flag; `derive(now, gracePeriodMs)` = offline allowance only |
| `domains/userSettings.ts` | Typed reader for user settings outside Zustand (used by notification handler) |

---

## Monetization

### AdMob

`ADS.md` is the reference — placements, units, cadence, gates and invariants. Banner ads per screen (`AdBanner`), interstitial via `adService`, rewarded via `rewardedAdService`. All ad surfaces check premium status and ad-free window before showing. Unit ids and kill switches are literals in `constants/admob.ts` and the app ids in `app.config.js` — never `.env`. An unconfigured unit (`UNIT_PENDING`) resolves to `null` and its surface requests nothing; `__DEV__` always gets Google's `TestIds`. `useAdPlacementActive({ unitId, enabled })` is the single predicate behind a placement: `AdBanner` renders from it, and its screen reserves `AD_BANNER_RESERVED_HEIGHT` from the same answer.

### RevenueCat

`SubscriptionProvider` wraps `Purchases` SDK. `usePremium()` hook exposes `isPremium`, `isInitialized`, `openPaywall({ source })` — which resolves `false` without opening or tracking anything for a subscriber or before the onboarding is complete. `applyCustomerInfo` is the single place a CustomerInfo becomes the tier (boot, foreground sync, purchase, restore). The offer itself is data: `utils/offerings.ts` turns `offerings.current` into `OfferingPlan[]`, and the context exposes `plans` / `defaultPlan` / `purchasePlan({ plan, source })` — no product id, plan count or trial length is hardcoded. The store owns the grace period after a failed payment; `subscriptionStorage.derive(now, gracePeriodMs)` is an offline allowance read only when the store could not be reached, and `SubscriptionGraceBanner` then says the clock is running.

### Contextual Paywall

`contextualPaywallService.evaluate(...)` uses:
- `engagementStorage.getSessionCount()` — only to hold the paywall back during the first session
- `engagementStorage.getActionCount()` — the threshold (`minActions`); the trigger (`after_n_actions` / `power_action` / `rewarded_ad_dismissed`) only names the source

`useContextualPaywall().maybeTrigger` refuses before recording an impression while no plan has loaded (`defaultPlan === null`): the impressions are capped for life and each one arms a cooldown.

**To hook your app's actions in:** call `recordAction()` from `useActionRating` on any meaningful user interaction (e.g. completing a feature action). It increments the lifetime counter first, then offers the moment to the contextual paywall, the interstitial and the rating prompt, in that order — the first to take it ends the chain, and all three share the session's single automatic interruption. `recordAction({ allowPromos: false })` counts without interrupting: the user's first success, an abandoned or failed action. Calling `engagementStorage.incrementAction()` directly moves the counter and offers the moment to nothing.

---

## Navigation

Expo Router file-based. Two tabs rendered by `TabLayout`:
1. `index` — Home screen
2. `settings` — Settings screen (lazy)

`PremiumTabBar` renders tab icons with blur background and haptic feedback.

`AppContent` gates the tabs behind onboarding: shows `OnboardingScreen` until `onboardingStore.isCompleted` is true.

---

## Onboarding

2-step flow in `OnboardingScreen.tsx`:
1. `WelcomeStep` — app introduction. A top-left pill opens the shared `LanguagePicker` bottom sheet for language selection.
2. `PremiumValueStep` — premium pitch (triggers paywall/trial). Skipping (via `ExitIntentSheet`) completes onboarding.

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
