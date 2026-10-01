# RN Starter — Mobile App Context

Concise reference for the generic starter's architecture as it actually exists.
Keep this in sync with CLAUDE.md and the code — update both as part of any change.

This file says what exists — routes, providers, stores, services, hooks, storage keys. CLAUDE.md says
why, and what not to do: a convention lives there and only there. Both stay in English.

---

## Overview

- **Bundle ID placeholder:** `com.yourcompany.rnstarter`
- **Monorepo:** `apps/mobile/` (this app), `apps/web/` (the site serving the legal pages), `apps/api/` (Cloudflare Worker, optional — `scripts/remove-api.sh`), `packages/shared/` (the Worker's types)
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

A `merge` result is not written back until the next `setState` (only a `migrate` is): a store whose `merge` changes what was on disk forces one write from `onRehydrateStorage`, deferred by a microtask past the synchronous hydration.

---

## Services

### `services/api/`

| Service | Description |
|---|---|
| `adService.ts` | AdMob interstitial — lazy-init, disabled when premium/ad-free; `setPremium` (written only by `SubscriptionProvider`) drops a preloaded ad, and its pending retries, the moment Pro is bought. `showInterstitialAd()` resolves `true` only once the ad has closed, and only then spends the cadence and the session's interruption |
| `rewardedAdService.ts` | AdMob rewarded — one preloaded ad per unit, addressed by `RewardedPlacement` and created lazily (`preload` / `isReady` / `show({ placement, onRewarded })`); grants the ad-free window on completion; `show` resolves `earned` / `dismissed` / `failed`, and only a dismissal is followed by the contextual paywall |
| `fullScreenAd.ts` | `presentFullScreenAd` — settles an interstitial or rewarded ad once it is gone (`CLOSED` / `ERROR`, or no `OPENED` within `PRESENTATION_TIMEOUT_MS`); `onEnd` runs whenever the presentation really ends, so an ad that opens late still pays its slot or its reward |
| `adFailures.ts` | `reportAdFailure({ error, source })` — sorts an ad failure by the library's code, stripped of its `googleMobileAds/` and Android-banner `error-code-` prefixes: a condition (no fill, network, server, timeout, internal error, OS too old, `null-activity` / `nil-vc`) is a Crashlytics breadcrumb plus a warning in development, anything else — a presentation that never opened included — a non-fatal. Called by both ad services, `presentFullScreenAd` and `AdBanner` |
| `analyticsService.ts` | Firebase Analytics typed wrapper (`track`, `setUserProperty`, `init`) |
| `paywallAnalytics.ts` | `trackShown` / `trackDismissed` compose `paywall_shown` (with the default plan's price and currency) and `paywall_dismissed`; `conversionContext()` is the engagement snapshot `purchase_completed` carries |
| `crashlyticsService.ts` | Firebase Crashlytics (`recordError`) |
| `engagementService.ts` | Session init (install date, session count); paywall counter; exposes `getPaywallContext` |
| `purchaseService.ts` | RevenueCat — `getOfferings`, `purchasePackage`, `restorePurchases`, `getAppUserId` (the id a backend call sends for the Worker's entitlement check), `managementUrl` (the store page of the subscription held, or null), `reportFailure` (classifies an error by its code; only `unknown` becomes a Crashlytics non-fatal) |
| `consentService.ts` | Google UMP consent gate; only caller of `mobileAds().initialize()` |
| `ratingService.ts` | `requestNativeReview()` (auto flows only; a failure is traced, never answered with the listing) / `openStoreListing({ reason })` (taps only) / `isNativeReviewAvailable()` |
| `reviewPolicy.ts` | `evaluateReviewRequest` — pure decision on a rating ask, same shape as `contextualPaywall/policy.ts`: store card available → legacy opt-out → streak cap → cooldown → install age → session count → action count → strong moment → ad quiet window → the session's interruption. Every refusal carries its reason |
| `contextualPaywall/` | `index.ts` (service: `evaluate`, `resetSession`, `recordShown`) + `policy.ts` (pure evaluation) |
| `backendClient.ts` | `getBackendClient()` — the one axios instance for `apps/api` (`BACKEND_CONFIG` base URL, timeout, `x-api-key` header); throws by name when `.env` lacks `BACKEND_URL` or `BACKEND_API_KEY` |
| `exampleService.ts` | `fetchExample({ signal })` and `fetchPremiumExample({ signal })` — the app-side calls to `GET /example` and `GET /example/premium` through `withRetry`, the pattern a backend call copies (no caller yet); the second sends `x-rc-customer-id` (`purchaseService.getAppUserId()`) for the Worker's entitlement check, and a free caller's `403` is not retried. A query's `queryFn` calls `getBackendClient()` directly instead |

### `services/notifications/`

| File | Description |
|---|---|
| `setup.ts` | `notificationService` — `readPermission()` / `requestPermission()` (`{ isGranted, canAskAgain }`, read off the OS, never a stored flag; the request only from the screen that shows what it is for), foreground presentation handler |
| `dailyReminders.ts` | `syncDailyReminders({ group, reminders, content })` — cancels the group, then one daily trigger per `{ id, hour, minute }`; queued, so the latest call holds. Never asks: without the grant it resolves `'permission_missing'`, warns in development and leaves a Crashlytics breadcrumb; it never rejects — a native failure, or a time out of range (checked before the group is touched), is `'failed'` and a non-fatal. A sync without the grant leaves the group empty, so the effect that syncs also depends on `useNotificationPermission().permission?.isGranted` |
| `channels.ts` | The Android channel (`ensureNotificationChannels`, `NOTIFICATION_CHANNEL_ID`) — its sound, vibration and importance are frozen at creation, so a change takes a new id; the app has no sound or vibration setting of its own |

`useNotificationPermission()` (`hooks/`) holds the grant for a screen and reads it again at every foreground; `request()` asks and returns what the OS answered. The starter asks for nothing and schedules nothing itself: both are there for the app's own notifications.

### `services/promo/`

`promoCoordinator.ts` — single in-memory authority over interruptive surfaces: the paywall, the AdMob interstitial and Google's consent form (`PromoSurface`).
Enforces no stacking (`isSurfaceVisible`) and one automatic interruption per session, all types included (`canPresentAutoPromo` / `markAutoPromoShown`). A paywall the user opens registers its visibility but spends no budget, and so does the consent form while it is up. Reset at boot via `contextualPaywallService.resetSession()`.

`sessionSignals.ts` — the failure the user just met: `markFriction(reason)`, `hadFriction()`, `frictionReason()`. One `FrictionReason` at a time, live for ten minutes and not overwritten meanwhile, in the process only. `SubscriptionProvider` marks `purchase_failed` and `restore_failed`; the contextual paywall and the rating ask refuse while one is live.

### `services/storage/`

| File/Dir | Description |
|---|---|
| `mmkv.ts` | Main MMKV instance |
| `secure.ts` | Encrypted MMKV instance holding the entitlement keys and nothing else — never encrypt the main one. `plugins/withBackupRules.js` keeps its files out of cloud backup and device transfer, with expo-modules-core's record of the permissions asked on the device |
| `adapter.ts` | Sync `StateStorage` adapter for Zustand `persist` |
| `keys.ts` | All MMKV key constants (`KEYS`) |
| `domains/adFree.ts` | Ad-free window expiry (encrypted instance) — a new reward adds to what is left, capped at `AD_REWARDED_FREE_MAX_MINUTES` |
| `domains/ads.ts` | Ad-cadence state (interstitial / rewarded cooldowns) |
| `domains/engagement.ts` | Session count, install date, paywall counter, **generic action counter** (`getActionCount` / `incrementAction`) — never reset |
| `domains/review.ts` | Review requests: count in the current streak and when the last one was made — `recordRequest` records an attempt, never a conclusion; `isOptedOut()` reads the two legacy opt-out flags nothing writes any more |
| `domains/subscription.ts` | Subscription expiry + lifetime flag (encrypted instance); `derive(now, gracePeriodMs)` = offline allowance only |

---

## Hooks

Three layers, one responsibility each: **`services/`** holds logic (no React, no `router`, no `t()`), **`hooks/`** the React orchestration, **`app/`** and **`components/`** the assembly and JSX.

| Hook | Description |
|---|---|
| `usePremium` | The subscription context (`SubscriptionProvider`): tier, plans and `defaultPlan`, `purchasePlan`, `restorePurchases`, `openPaywall`, `billingIssue`, `managementUrl` |
| `usePaywallPlans` | `usePaywallPlans({ source, surface })` — what a selling surface says about the offer (plan options, CTA, legal note) and `purchaseSelected` for the plan it has selected |
| `useContextualPaywall` | `maybeTrigger(trigger)` — opens the paywall at a value moment when the policy allows; the impression is recorded only once it opened |
| `useActionRating` | `recordAction({ allowPromos })` — where an app wires its value moments: counts the action, offers it to the contextual paywall, then the interstitial, and otherwise arms the rating ask |
| `useRatingPrompt` | `maybeAskForRating({ moment })` — gathers the state, runs `evaluateReviewRequest`, and asks for Play's card or traces the refusal |
| `useCappedByTier` | `useCappedByTier({ items, freeLimit })` → `items`, `allItems`, `limit`, `isCapped`, `canAdd`: a free-tier limit applied on read (no caller yet) |
| `useAdPlacementActive` | `useAdPlacementActive({ unitId, enabled })` — whether a placement runs: `useCanServeAd` plus the ad-free window |
| `useCanServeAd` | `useCanServeAd({ unitId, enabled })` — whether an ad can be served at all: kill switch, configured unit, the store's answer and the tier, consent, environment; what `AdFreeSection` renders from |
| `useAdsConsent` | The UMP snapshot (`canRequestAds`, `arePrivacyOptionsRequired`), subscribed to `consentService` |
| `useAdFreeRemainingMinutes` | Minutes left in the rewarded ad-free window, ticking |
| `useNotificationPermission` | `{ permission, request }` — the grant read off the OS, again at every foreground |
| `useNetworkStatus` | `{ isOnline }` off the app's one NetInfo subscription, unknown read as online; its `getIsOnline` / `subscribeToNetworkStatus` feed the query client's `onlineManager`, and `getIsOnline` the rating ask; `OfflineBanner` reads the hook |
| `useHardwareBack` | `useHardwareBack(onBack)` — the Android back key, for the focused route only |
| `useStageActive` | True while the screen is focused and the app in the foreground — what `AdBanner` mounts on |
| `useSheetSnap` | `ModalBottomSheet`'s springs, snap points and dismiss pan |
| `useKeyboardHeight` | `useKeyboardHeight({ enabled })` — the keyboard's height, off its own events |
| `useResponsiveLayout` | `width`, `height`, `contentWidth`, `gutter`, `isLargeScreen` |
| `useTabBarPadding` | `useTabBarPadding(extra)` — `TAB_BAR_HEIGHT + insets.bottom + extra`, the room under the absolute tab bar |
| `useThemedColor` | Whether the scheme on screen is dark |
| `useDebounce` | `useDebounce(value, delay)` — the value once it has settled (no caller yet) |

---

## Monetization

### AdMob

`ADS.md` is the reference — placements, units, cadence, gates and invariants. Banner ads per screen (`AdBanner`), interstitial via `adService`, rewarded via `rewardedAdService`. All ad surfaces check premium status and ad-free window before showing. Unit ids and kill switches are literals in `constants/admob.ts` and the app ids in `app.config.js` — never `.env`. An unconfigured unit (`UNIT_PENDING`) resolves to `null` and its surface requests nothing; `__DEV__` always gets Google's `TestIds`. `useAdPlacementActive({ unitId, enabled })` is the single predicate behind a placement: `AdBanner` renders from it, and its screen reserves `AD_BANNER_RESERVED_HEIGHT` from the same answer. It is `useCanServeAd` plus the ad-free window; Settings' rewarded section (`AdFreeSection`) renders from `useCanServeAd` alone, and shows the time left while a window is open.

### RevenueCat

`SubscriptionProvider` wraps `Purchases` SDK. `usePremium()` hook exposes `isPremium`, `isInitialized`, `openPaywall({ source })` — which resolves `false` without opening or tracking anything for a subscriber or before the onboarding is complete. `applyCustomerInfo` is the single place a CustomerInfo becomes the tier (boot, foreground sync, purchase, restore). A failed `configure` ends the price loading, and `retryPrices` / `refreshSubscription` start the store again until one succeeds; the foreground sync waits for it. The offer itself is data: `utils/offerings.ts` turns `offerings.current` into `OfferingPlan[]`, and the context exposes `plans` / `defaultPlan` / `purchasePlan({ plan, source, surface })` / `restorePurchases({ source, surface })` — no product id, plan count or trial length is hardcoded. `usePaywallPlans({ source, surface })` turns the offer into what a surface says (plan labels, captions, badges, CTA, legal note) and buys the selected plan. `source` is what brought the sale up, `surface` (`PurchaseSurface`) the screen the tap landed on; both ride on every `purchase_*` and `restore_*` event. The store owns the grace period after a failed payment — RevenueCat flags it with `billingIssueDetectedAtMillis`, which becomes `billingIssue` on the context and `BillingIssueBanner` in Settings, informational only. `PRO_BENEFITS` (`constants/purchases.ts`) is the one list of what Pro unlocks, rendered by `PaywallPerks` on the paywall and on the onboarding's premium step, and joined on one line by `PremiumBanner` for a free user; each entry names a limit the free tier enforces — in the starter, only its ads. A free-tier limit applies on read: the store keeps the whole selection and `useCappedByTier({ items, freeLimit })` returns what the tier allows (`items`, `allItems`, `limit`, `isCapped`, `canAdd`), off the cached tier, never waiting on `isInitialized`. `PremiumBanner` offers a subscriber a *Manage subscription* row whenever `managementUrl` is non-null. `subscriptionStorage.derive(now, gracePeriodMs)` is an offline allowance read only before the store has answered or when it could not be reached, and `SubscriptionGraceBanner` then says the clock is running. `FORCE_FREE` / `FORCE_PRO` (development only, `FORCE_FREE` winning) replace the store's answer inside `applyCustomerInfo` and never reach `subscriptionStorage`; the release workflow refuses a `MOBILE_DOTENV` that sets either.

### Contextual Paywall

`contextualPaywallService.evaluate(...)` uses:
- `engagementStorage.getSessionCount()` — only to hold the paywall back during the first session
- `engagementStorage.getActionCount()` — the threshold (`minActions`); the trigger (`after_n_actions` / `power_action` / `rewarded_ad_dismissed`) only names the source
- `sessionSignals.hadFriction()` — refused as `friction` while a failed purchase or restore is live

`useContextualPaywall().maybeTrigger` refuses before recording an impression while no plan has loaded (`defaultPlan === null`), and records one only once `openPaywall` resolves `true`: the impressions are capped for life and each one arms a cooldown.

**To hook your app's actions in:** call `recordAction()` from `useActionRating` on any meaningful user interaction (e.g. completing a feature action). It increments the lifetime counter first, then offers the moment to the contextual paywall and the interstitial, in that order; a moment neither took arms the rating ask, which waits for the user to come back (App Rating below). The first to take it ends the chain, and all three share the session's single automatic interruption. `recordAction({ allowPromos: false })` counts without interrupting: the user's first success, an abandoned or failed action. Calling `engagementStorage.incrementAction()` directly moves the counter and offers the moment to nothing.

### App Rating

`useRatingPrompt().maybeAskForRating({ moment })` is the single entry point. It gathers the state when it is asked — `reviewStorage`, the install date, the session and action counters, the last ad, `promoCoordinator`, `sessionSignals`, the connection (`getIsOnline()`); never the session's boot snapshot, which a warm return can outlive by days — and `evaluateReviewRequest` decides: Play's card is requested (`rating_ask_shown`) or the refusal is tracked with its reason (`rating_ask_suppressed`). A `RatingMoment` names where the ask came from, and an app adds its own to `constants/rating.ts`, listing in `STRONG_RATING_MOMENTS` those allowed to open the card. `recordAction()` never asks: it arms `action_completed` (`reviewStorage.setArmed`, persisted), and `RatingAskHost` raises it at a launch or on a return after five minutes away — Android reports an ad, the billing sheet or Play's own card over the app as a background too — 1.2 s after the screen is back. The arming lasts until the ask launches or a refusal outlives the session; a collision, a friction or a lost connection keeps it for a later one. The thresholds are `REVIEW_REQUEST_CONFIG`: at most three requests in a streak, 42 then 126 days apart, a streak ending after 180 days without one; not until two days after install, the second session and seven actions; not within two minutes of an interstitial, nor in a session whose interruption is spent, nor within ten minutes of a failed purchase or restore (`friction`, its `friction_reason` on `rating_ask_suppressed`), nor offline (`offline`, NetInfo's unknown state counting as online) — and never on a device with no store card, where nothing is spent. `requestNativeReview()` settles 700 ms before asking, for a moment an app raises itself, and asks nothing once the app has left the foreground (`review_flow_failed`, `app_backgrounded`). When the card cannot come, the user stays where they are: the listing opens only on a tap.

---

## Navigation

Expo Router file-based. Two tabs rendered by `TabLayout`:
1. `index` — Home screen
2. `settings` — Settings screen (lazy)

`PremiumTabBar` renders tab icons with blur background and haptic feedback.

`AppContent` gates the tabs behind onboarding: shows `OnboardingScreen` until `onboardingStore.isCompleted` is true.

`useHardwareBack(onBack)` takes the Android back key for the focused route only (`useFocusEffect`); a surface that is not a route, like the onboarding, listens to `BackHandler` itself.

A flow that ends goes home through `resetToHome(href?)` (`utils/navigation.ts`: dismiss to the root, then replace), never a bare `router.replace('/')`, which leaves the flow's earlier screens under Home. A route whose session is gone returns `<ExitToHome />` (`components/layout/`), not `<Redirect href="/" />`.

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

EN and FR are the source of truth; the translation policy, the voice charter and the parity a translation session owes are in CLAUDE.md.

---

## Data Fetching

TanStack Query v5 for server state. `QueryProvider` uses `PersistQueryClientProvider` + MMKV persister. Cache buster = app version. `onlineManager` reads the NetInfo subscription in `hooks/useNetworkStatus.ts`, so retries pause offline and `refetchOnReconnect` fires; a query retries three times at most and never a status `isNonRetryableError` (`utils/apiErrors.ts`) calls final. `withRetry`, for calls made outside a query, gives up with an `ApiRequestError` carrying `statusCode` and `code` beside its message.

All of it serves `apps/api` but `hooks/useNetworkStatus.ts`, which the app keeps for itself: `scripts/remove-api.sh` removes the rest with the Worker, for an app with no backend (CLAUDE.md, Data Fetching).

---

## Styling

NativeWind v4, dark mode via `'class'` strategy. The theme setting is `'auto'` (the default), `'light'` or `'dark'`; `applyColorScheme` hands `'auto'` to NativeWind as `'system'`, and `useThemedColor()` says whether the scheme on screen is dark. Reanimated 4 + Moti for animations. `GradientButton` for primary CTAs. Brand colours are three role scales in `constants/palette.js` — `accent`, `pro`, `success` — read by `tailwind.config.js` (`bg-accent-500`, `dark:text-pro-300`), by `UI_COLORS` (`UI_COLORS.accent[500]`) and by `Colors.ts`'s tint. Gradient colours are `GRADIENTS` tokens in `constants/uiColors.ts`, named by role (`cta`, `pro`, `rewarded`, `success`, `onboardingStepLight` / `onboardingStepDark`). `ToastProvider` for feedback; mount `ModalToastViewport` inside modals to surface toasts over them.

Tabs share a 20 px gutter, set as `paddingHorizontal` on the `ScrollView`'s content container, and a `ScreenHeading` at `mt-3.5`.

`AppSystemBars` sets the status and navigation bar styles — once for the app in `ThemeProvider`, again by a screen that forces its own — and stacks the forced navigation bar styles, since `setStyle` is global: the last one mounted wins, the theme's when none is left.

`ThemedText` derives a line height whenever `style` sets `fontSize` without one.

`ScreenContainer` caps its content at `UI_CONFIG.MAX_CONTENT_WIDTH` (600), centred — a cap that never binds on a phone. A native `Modal` is outside that column and caps itself (`PaywallModal` caps its scroll view and, on a large screen, its hero's height); `useResponsiveLayout()` gives `width`, `height`, `contentWidth`, `gutter` and `isLargeScreen` for what a style cannot express.

`ModalBottomSheet` assembles `useSheetSnap` (springs, snap points, the dismiss pan) and `components/ui/modalSheet/` (`contexts.ts`, and `scrollables.tsx` — `ModalBottomSheetFlatList` / `ModalBottomSheetScrollView`, re-exported from `ModalBottomSheet`, with `useModalSheetPanGesture()` for a scrollable that must block the sheet's pan). Content that drags inside a sheet raises its `dragLock` while it holds the finger; a pan it held never dismisses the sheet.

`ModalDialog` — the centred sibling of `ModalBottomSheet` (title, subtitle, body, a `footer` outside the body); it pads itself by `useKeyboardHeight()`, since the keyboard no longer resizes a modal window on Android.

`SettingsRow` — the settings row (icon plate, title, description, value, `pro` badge, accessory, chevron); `toggle` makes the whole row a switch, drawing `AppSwitch` (decoration only) and carrying the switch role and state. The language row in `DisplaySection` is built on it; `SettingsLinkRow` stays for plain links. `ProBadge` marks what the free tier cannot use.

`WheelPicker` — a snapping wheel whose touch column is far wider than its digits, `unit` drawn inside it untouchable; it blocks a host sheet's pan.

`OfflineBanner` — no props: reads `useNetworkStatus()` and renders nothing online, else an orange plate with `cloud-offline` and `common.offline`, a polite live region on Android and announced on iOS. Mounted nowhere yet.

---

## Known gaps

Deliberate and documented — do not "fix" them blindly. Each has its reason in CLAUDE.md or `docs/boilerplate-audit/ROADMAP.md` §4.

- **No onboarding step asks anything.** `OnboardingStepLayout` has no caller: a demo step would be a screen every app ships asking nothing. An app's first question — its notification ask, typically — is its first caller.
- **The starter asks for no permission and schedules nothing.** `POST_NOTIFICATIONS` stays declared and the ask, the grant's readback and `syncDailyReminders` wait for the app's first notification.
- **Remote push is not wired on the device.** `apps/api` ships the FCM sender; `@react-native-firebase/messaging` is not installed, since a handler nothing registers would look like working push.
- **`aps-environment` is declared though nothing is pushed.** `expo-notifications` writes the entitlement whatever the config says; the declaration only states it.
- **`AppRatingModal` compiles and is mounted nowhere.** Play forbids pre-filtering the review; `SENTIMENT_GATE_ENABLED` is read by nothing, so bringing it back means wiring it.
- **Nothing is capped, persisted or called yet.** `useCappedByTier`, `useDebounce` and `OfflineBanner` have no caller, `PERSISTED_QUERY_KEYS` is empty, `exampleService` is the pattern a backend call copies, and `PRO_BENEFITS` holds one entry — the ads, the only thing the starter gates.
- **The Worker's entitlement check lets everyone through until RevenueCat's secret and project id are set**, and says so in its logs.
- **The onboarding is not capped on large screens**, unlike every tab: a design pass, not a structural one.
- **Every build opens `/privacy` and `/terms` in English**, whatever its language: the site serves `/fr/privacy`, but choosing that path from the app changes the paths contract.
- **`APP_STORE_APP_ID` is `null`** until the iOS release; the App Store opens nothing from a bundle id.
- **The starter ships no data migration**: it has no installs. An app porting a storage change onto a released build owes its users one.
- **The 18 other languages lag `en.json`**, most of the paywall, the onboarding and the home screen showing in English; they are brought to parity in a translation session, never alongside feature work.

---

## Path Aliases

`@/*`, `@components/*`, `@services/*`, `@stores/*`, `@hooks/*`, `@utils/*`, `@constants/*`, `@types/*`, `@i18n/*`, `@assets/*`. No `@providers/*` alias — use `@/providers/*`.
