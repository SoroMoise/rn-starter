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
              > SubscriptionProvider   <- RevenueCat, offline allowance, billing issue, PaywallModal
                > AdFreeProvider       <- ad-free session window tracking
                  > AppContent         <- onboarding gate, then TabLayout (+ RatingAskHost once the session started)
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
| Paywall modal | `components/paywall/PaywallModal.tsx` | RevenueCat purchase sheet, assembled from the `components/paywall/` blocks (`PaywallHero`, `PaywallPerks`, `PaywallPlanCard`, `PaywallTrustRow`, `PaywallLegalLinks`, `PriceRetryNotice`) over `usePaywallPlans` |

---

## Stores

All stores in `apps/mobile/stores/`. Persisted stores use Zustand `persist` + MMKV via `mmkvStateStorage`.

| Store | Persisted | Description |
|---|---|---|
| `settingsStore` | Yes | User preferences (theme, language), RTL restart state |
| `onboardingStore` | Yes | Onboarding completion, the exit sheet already offered (`attemptedSkipTrial`), Pro welcome seen — the current step is not persisted |

---

## Services

### `services/api/`

| Service | Description |
|---|---|
| `adService.ts` | AdMob interstitial — lazy-init, disabled when premium/ad-free; `setPremium` (written only by `SubscriptionProvider`) drops a preloaded ad, and its pending retries, the moment Pro is bought. `showInterstitialAd()` resolves `true` only once the ad has closed, and only then spends the cadence and the session's interruption |
| `rewardedAdService.ts` | AdMob rewarded — lazy-init, grants ad-free window on completion; `showRewardedAd` resolves `earned` / `dismissed` / `failed`, and only a dismissal is followed by the contextual paywall |
| `fullScreenAd.ts` | `presentFullScreenAd` — settles an interstitial or rewarded ad once it is gone (`CLOSED` / `ERROR`, or no `OPENED` within `PRESENTATION_TIMEOUT_MS`); `onEnd` runs whenever the presentation really ends, so an ad that opens late still pays its slot or its reward |
| `analyticsService.ts` | Firebase Analytics typed wrapper (`track`, `setUserProperty`, `init`) |
| `paywallAnalytics.ts` | `trackShown` / `trackDismissed` compose `paywall_shown` (with the default plan's price and currency) and `paywall_dismissed`; `conversionContext()` is the engagement snapshot `purchase_completed` carries |
| `crashlyticsService.ts` | Firebase Crashlytics (`recordError`) |
| `engagementService.ts` | Session init (install date, session count); paywall counter; exposes `getPaywallContext` |
| `purchaseService.ts` | RevenueCat — `getOfferings`, `purchasePackage`, `restorePurchases`, `managementUrl` (the store page of the subscription held, or null), `reportFailure` (classifies an error by its code; only `unknown` becomes a Crashlytics non-fatal) |
| `consentService.ts` | Google UMP consent gate; only caller of `mobileAds().initialize()` |
| `ratingService.ts` | `requestNativeReview()` (auto flows only; a failure is traced, never answered with the listing) / `openStoreListing({ reason })` (taps only) / `isNativeReviewAvailable()` |
| `reviewPolicy.ts` | `evaluateReviewRequest` — pure decision on a rating ask, same shape as `contextualPaywall/policy.ts`: store card available → legacy opt-out → streak cap → cooldown → install age → session count → action count → strong moment → ad quiet window → the session's interruption. Every refusal carries its reason |
| `contextualPaywall/` | `index.ts` (service: `evaluate`, `resetSession`, `recordShown`) + `policy.ts` (pure evaluation) |

### `services/notifications/`

| File | Description |
|---|---|
| `setup.ts` | `notificationService` — permission request/primer, foreground presentation handler |
| `channels.ts` | Android notification channel setup (`ensureNotificationChannels`, `NOTIFICATION_CHANNEL_ID`) |

### `services/promo/`

`promoCoordinator.ts` — single in-memory authority over interruptive surfaces: the paywall, the AdMob interstitial and Google's consent form (`PromoSurface`).
Enforces no stacking (`isSurfaceVisible`) and one automatic interruption per session, all types included (`canPresentAutoPromo` / `markAutoPromoShown`). A paywall the user opens registers its visibility but spends no budget, and so does the consent form while it is up. Reset at boot via `contextualPaywallService.resetSession()`.

### `services/storage/`

| File/Dir | Description |
|---|---|
| `mmkv.ts` | Main MMKV instance |
| `secure.ts` | Encrypted MMKV instance holding the entitlement keys and nothing else — never encrypt the main one. `plugins/withBackupRules.js` keeps its files out of cloud backup and device transfer |
| `adapter.ts` | Sync `StateStorage` adapter for Zustand `persist` |
| `keys.ts` | All MMKV key constants (`KEYS`) |
| `domains/adFree.ts` | Ad-free window expiry (encrypted instance) — a new reward adds to what is left, capped at `AD_REWARDED_FREE_MAX_MINUTES` |
| `domains/ads.ts` | Ad-cadence state (interstitial / rewarded cooldowns) |
| `domains/engagement.ts` | Session count, install date, paywall counter, **generic action counter** (`getActionCount` / `incrementAction`) — never reset |
| `domains/review.ts` | Review requests: count in the current streak and when the last one was made — `recordRequest` records an attempt, never a conclusion; `isOptedOut()` reads the two legacy opt-out flags nothing writes any more |
| `domains/subscription.ts` | Subscription expiry + lifetime flag (encrypted instance); `derive(now, gracePeriodMs)` = offline allowance only |
| `domains/userSettings.ts` | Typed reader for user settings outside Zustand (used by notification handler) |

---

## Monetization

### AdMob

`ADS.md` is the reference — placements, units, cadence, gates and invariants. Banner ads per screen (`AdBanner`), interstitial via `adService`, rewarded via `rewardedAdService`. All ad surfaces check premium status and ad-free window before showing. Unit ids and kill switches are literals in `constants/admob.ts` and the app ids in `app.config.js` — never `.env`. An unconfigured unit (`UNIT_PENDING`) resolves to `null` and its surface requests nothing; `__DEV__` always gets Google's `TestIds`. `useAdPlacementActive({ unitId, enabled })` is the single predicate behind a placement: `AdBanner` renders from it, and its screen reserves `AD_BANNER_RESERVED_HEIGHT` from the same answer.

### RevenueCat

`SubscriptionProvider` wraps `Purchases` SDK. `usePremium()` hook exposes `isPremium`, `isInitialized`, `openPaywall({ source })` — which resolves `false` without opening or tracking anything for a subscriber or before the onboarding is complete. `applyCustomerInfo` is the single place a CustomerInfo becomes the tier (boot, foreground sync, purchase, restore). The offer itself is data: `utils/offerings.ts` turns `offerings.current` into `OfferingPlan[]`, and the context exposes `plans` / `defaultPlan` / `purchasePlan({ plan, source, surface })` / `restorePurchases({ source, surface })` — no product id, plan count or trial length is hardcoded. `usePaywallPlans({ source, surface })` turns the offer into what a surface says (plan labels, captions, badges, CTA, legal note) and buys the selected plan. `source` is what brought the sale up, `surface` (`PurchaseSurface`) the screen the tap landed on; both ride on every `purchase_*` and `restore_*` event. The store owns the grace period after a failed payment — RevenueCat flags it with `billingIssueDetectedAtMillis`, which becomes `billingIssue` on the context and `BillingIssueBanner` in Settings, informational only. `PRO_BENEFITS` (`constants/purchases.ts`) is the one list of what Pro unlocks, rendered by `PaywallPerks` on the paywall and on the onboarding's premium step; each entry names a limit the free tier enforces — in the starter, only its ads. `PremiumBanner` offers a subscriber a *Manage subscription* row whenever `managementUrl` is non-null. `subscriptionStorage.derive(now, gracePeriodMs)` is an offline allowance read only before the store has answered or when it could not be reached, and `SubscriptionGraceBanner` then says the clock is running. `FORCE_FREE` / `FORCE_PRO` (development only, `FORCE_FREE` winning) replace the store's answer inside `applyCustomerInfo` and never reach `subscriptionStorage`; the release workflow refuses a `MOBILE_DOTENV` that sets either.

### Contextual Paywall

`contextualPaywallService.evaluate(...)` uses:
- `engagementStorage.getSessionCount()` — only to hold the paywall back during the first session
- `engagementStorage.getActionCount()` — the threshold (`minActions`); the trigger (`after_n_actions` / `power_action` / `rewarded_ad_dismissed`) only names the source

`useContextualPaywall().maybeTrigger` refuses before recording an impression while no plan has loaded (`defaultPlan === null`), and records one only once `openPaywall` resolves `true`: the impressions are capped for life and each one arms a cooldown.

**To hook your app's actions in:** call `recordAction()` from `useActionRating` on any meaningful user interaction (e.g. completing a feature action). It increments the lifetime counter first, then offers the moment to the contextual paywall and the interstitial, in that order; a moment neither took arms the rating ask, which waits for the user to come back (App Rating below). The first to take it ends the chain, and all three share the session's single automatic interruption. `recordAction({ allowPromos: false })` counts without interrupting: the user's first success, an abandoned or failed action. Calling `engagementStorage.incrementAction()` directly moves the counter and offers the moment to nothing.

### App Rating

`useRatingPrompt().maybeAskForRating({ moment })` is the single entry point. It gathers the state when it is asked — `reviewStorage`, the install date, the session and action counters, the last ad, `promoCoordinator`; never the session's boot snapshot, which a warm return can outlive by days — and `evaluateReviewRequest` decides: Play's card is requested (`rating_ask_shown`) or the refusal is tracked with its reason (`rating_ask_suppressed`). A `RatingMoment` names where the ask came from, and an app adds its own to `constants/rating.ts`, listing in `STRONG_RATING_MOMENTS` those allowed to open the card. `recordAction()` never asks: it arms `action_completed` (`reviewStorage.setArmed`, persisted), and `RatingAskHost` raises it at a launch or on a return after five minutes away — Android reports an ad, the billing sheet or Play's own card over the app as a background too — 1.2 s after the screen is back. The arming lasts until the ask launches or a refusal outlives the session; a collision keeps it for a later one. The thresholds are `REVIEW_REQUEST_CONFIG`: at most three requests in a streak, 42 then 126 days apart, a streak ending after 180 days without one; not until two days after install, the second session and seven actions; not within two minutes of an interstitial, nor in a session whose interruption is spent — and never on a device with no store card, where nothing is spent. When the card cannot come, the user stays where they are: the listing opens only on a tap.

---

## Navigation

Expo Router file-based. Two tabs rendered by `TabLayout`:
1. `index` — Home screen
2. `settings` — Settings screen (lazy)

`PremiumTabBar` renders tab icons with blur background and haptic feedback.

`AppContent` gates the tabs behind onboarding: shows `OnboardingScreen` until `onboardingStore.isCompleted` is true.

---

## Onboarding

Steps are `OnboardingStepKind`s (`types/onboarding.ts`) listed in order by `buildSteps()` in `OnboardingScreen.tsx`; a step gated on a device capability joins the list there, so navigation (`goToStep(kind)`, `goNext()`) goes by name and the progress bar reads `steps.length`. The current flow:
1. `WelcomeStep` — app introduction. A top-left pill opens the shared `LanguagePicker` bottom sheet for language selection.
2. `PremiumValueStep` — premium pitch: sells the offering's default plan through `usePaywallPlans` and the paywall's blocks (`PaywallPerks`, `PaywallTrustRow`, legal note, `PaywallLegalLinks`), with a trial frieze drawn only for a free trial (unlock today, billing on its last day); with no plan loaded, `paywall.offerUnavailable` and `PriceRetryNotice` replace the CTA. Skipping opens `ExitIntentSheet` (once per install — `attemptedSkipTrial`), whose title, body and CTA follow the default plan (trial / subscription without one / one-time unlock) above the same legal note; leaving it completes onboarding, and so does becoming Pro on this step — a purchase from the pitch or the exit sheet, or a restore: an effect in `OnboardingScreen` keyed on the entitlement, never on the purchase call. A subscriber detected on the welcome step gets `ProWelcomeModal` once.

A step that asks for a decision is built on `OnboardingStepLayout` (gradient, icon, title, subtitle, content, CTA inside the scroll view, optional `secondary` action); the starter ships none, so an app's first such step is its first caller.

The Android back key steps back through the flow (`BackHandler` in `OnboardingScreen`) — it is not a route, so the key would otherwise exit the app; the first step lets that default through.

After completion, `onboardingStore.markCompleted()` is called and `AppContent` renders the tabs.

---

## i18n

20 languages: en, fr, es, de, pt-BR, zh-CN, zh-TW, ja, ko, ar, hi, bn, ru, id, tr, it, nl, sv, pl, vi. Lazy-loaded JSON files in `i18n/languages/`. RTL for `ar` triggers `I18nManager.forceRTL` + restart (gated by `RTL_RESTART_BANNER_ENABLED`). RTL mirrors the layout but never a transform: an indicator sliding along a row flips its travel by `I18nManager.isRTL`.

**Translation policy:** EN + FR are the source of truth. Other languages are updated in dedicated sessions, never mixed with feature work.

---

## Data Fetching

TanStack Query v5 for server state. `QueryProvider` uses `PersistQueryClientProvider` + MMKV persister. Cache buster = app version.

---

## Styling

NativeWind v4, dark mode via `'class'` strategy. Reanimated 4 + Moti for animations. `GradientButton` for primary CTAs. Gradient colours are `GRADIENTS` tokens in `constants/uiColors.ts`, named by role (`cta`, `pro`, `onboardingStepLight` / `onboardingStepDark`). `ToastProvider` for feedback; mount `ModalToastViewport` inside modals to surface toasts over them.

`ThemedText` derives a line height whenever `style` sets `fontSize` without one.

`ScreenContainer` caps its content at `UI_CONFIG.MAX_CONTENT_WIDTH` (600), centred — a cap that never binds on a phone. A native `Modal` is outside that column and caps itself (`PaywallModal` caps its scroll view and, on a large screen, its hero's height); `useResponsiveLayout()` gives `width`, `height`, `contentWidth`, `gutter` and `isLargeScreen` for what a style cannot express. Never read `Dimensions.get()` at module scope.

`ModalBottomSheet` assembles `useSheetSnap` (springs, snap points, the dismiss pan) and `components/ui/modalSheet/` (`contexts.ts`, and `scrollables.tsx` — `ModalBottomSheetFlatList` / `ModalBottomSheetScrollView`, re-exported from `ModalBottomSheet`, with `useModalSheetPanGesture()` for a scrollable that must block the sheet's pan). Content that drags inside a sheet raises its `dragLock` while it holds the finger; a pan it held never dismisses the sheet.

`ModalDialog` — the centred sibling of `ModalBottomSheet` (title, subtitle, body, a `footer` outside the body); it pads itself by `useKeyboardHeight()`, since the keyboard no longer resizes a modal window on Android.

`SettingsRow` — the settings row (icon plate, title, description, value, `pro` badge, accessory, chevron); `toggle` makes the whole row a switch, drawing `AppSwitch` (decoration only) and carrying the switch role and state. The language row in `DisplaySection` is built on it; `SettingsLinkRow` stays for plain links. `ProBadge` marks what the free tier cannot use.

`WheelPicker` — a snapping wheel whose touch column is far wider than its digits, `unit` drawn inside it untouchable; it blocks a host sheet's pan.

---

## Path Aliases

`@/*`, `@components/*`, `@services/*`, `@stores/*`, `@hooks/*`, `@utils/*`, `@constants/*`, `@types/*`, `@i18n/*`, `@assets/*`. No `@providers/*` alias — use `@/providers/*`.
