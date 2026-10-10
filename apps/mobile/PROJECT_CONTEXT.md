# RN Starter — Mobile App Context

What exists in the generic starter — routes, providers, stores, services, hooks, storage keys, modules, known gaps. CLAUDE.md says why, and what not to do: a convention lives there and only there. Both stay in English and are updated together with the code.

---

## Overview

- **Bundle ID placeholder:** `com.yourcompany.rnstarter`
- **Monorepo:** `apps/mobile/` (this app), `apps/web/` (the site serving the legal pages), `apps/api/` (Cloudflare Worker, optional — `scripts/remove-api.sh`), `packages/shared/` (the Worker's types)
- **Version:** `versionCode` computed in `app.config.js` — `major*1000000 + minor*1000 + patch`, strictly increasing up to `x.999.999`

---

## Provider Tree

Composition in `app/_layout.tsx` (outer → inner):

```
SafeAreaProvider
  > RootLayoutContent
      TelemetryEffects         <- side-effect only, no children
      GestureHandlerRootView
        > QueryProvider        <- TanStack Query (PersistQueryClientProvider + MMKV, persists nothing by default)
          > ThemeProvider      <- light/dark via NativeWind 'class'; mounts AppSystemBars
            > ToastProvider    <- toast stack (ModalToastViewport for modals)
              > SubscriptionProvider   <- RevenueCat, offline allowance, billing issue, PaywallModal
                > AdFreeProvider       <- ad-free window tracking
                  > AppContent         <- onboarding gate, then the root Stack (+ RatingAskHost once the session started)
      RTLRestartBanner         <- outside provider tree
```

Persisted Zustand stores hydrate synchronously from MMKV (`mmkvStateStorage`) at module import; there is no async boot gate.

---

## Screens

| Route | File | Description |
|---|---|---|
| `/(tabs)/index` | `app/(tabs)/index.tsx` | Home — premium feature showcase, paywall CTA |
| `/(tabs)/settings` | `app/(tabs)/settings.tsx` | Settings (lazy) — theme, language, premium, ads, legal |
| Onboarding | `components/onboarding/OnboardingScreen.tsx` | 2 steps: welcome → premium value (top-left language selector on welcome) |
| Paywall modal | `components/paywall/PaywallModal.tsx` | RevenueCat purchase sheet, assembled from `components/paywall/` (`PaywallHero`, `PaywallPerks`, `PaywallPlanCard`, `PaywallTrustRow`, `PaywallLegalLinks`, `PriceRetryNotice`) over `usePaywallPlans`; its first close raises `LifetimeOfferCard` when the offer holds a one-time plan |

---

## Stores

`apps/mobile/stores/`, Zustand `persist` + MMKV via `mmkvStateStorage`.

| Store | Persisted | Description |
|---|---|---|
| `settingsStore` | Yes | Theme (`'auto'` / `'light'` / `'dark'`), language, RTL restart state |
| `onboardingStore` | Yes | `isCompleted`, `attemptedSkipTrial` (exit sheet offered once), `hasSeenProWelcome` — the current step is not persisted |

---

## Services

### `services/api/`

| Service | Description |
|---|---|
| `adService.ts` | AdMob interstitial — lazy-init; `setPremium` (written by `SubscriptionProvider` only) drops a preloaded ad and its pending retries; `showInterstitialAd()` resolves `true` once the ad has closed |
| `rewardedAdService.ts` | AdMob rewarded — one preloaded ad per unit, by `RewardedPlacement` (`preload` / `isReady` / `show({ placement, onRewarded })`); grants the ad-free window; `show` resolves `earned` / `dismissed` / `failed` |
| `fullScreenAd.ts` | `presentFullScreenAd` — settles an interstitial or rewarded ad on `CLOSED` / `ERROR`, or no `OPENED` within `PRESENTATION_TIMEOUT_MS`; `onEnd` runs whenever the presentation really ends |
| `adFailures.ts` | `reportAdFailure({ error, source })` — sorts by the library's code (prefixes `googleMobileAds/` and `error-code-` stripped): no fill, network, server, timeout, internal error, OS too old, `null-activity` / `nil-vc` are breadcrumbs; anything else a non-fatal. Called by both ad services, `presentFullScreenAd` and `AdBanner` |
| `adEnvironment.ts` | `adsAllowedInEnvironment()` — false on a Firebase Test Lab device (`modules/app-environment`); gates the banner, both ad services and the consent flow |
| `consentService.ts` | Google UMP consent gate (`gather`, `presentForm`, `canRequestAds`, `arePrivacyOptionsRequired`); only caller of `mobileAds().initialize()`. Under `__DEV__` it passes `UMP_DEBUG_GEOGRAPHY` (`EEA`) and `UMP_TEST_DEVICE_IDS` (from `app.config.js` `extra.consentDebug`) to the request, to see the form from outside the EEA (`ADS.md` §10) |
| `analyticsService.ts` | Firebase Analytics typed wrapper (`track`, `setUserProperty`, `init`) |
| `paywallAnalytics.ts` | `trackShown` / `trackDismissed` / `trackLifetimeOfferShown` compose `paywall_shown` (default plan's `default_price` + `currency`), `paywall_dismissed` (`lifetime_offer_shown`) and `paywall_lifetime_offer_shown`; `conversionContext()` is the engagement snapshot `purchase_completed` carries |
| `crashlyticsService.ts` | Firebase Crashlytics (`recordError`) |
| `engagementService.ts` | Session init (install date, session count), paywall counter, `getPaywallContext` |
| `purchaseService.ts` | RevenueCat — `getOfferings`, `purchasePackage`, `restorePurchases`, `getAppUserId` (the id a backend call sends), `managementUrl` (the store page of the subscription held, or null), `reportFailure({ error, source })` → `cancelled` / `pending` / `already_owned` / `not_allowed` / `store_problem` / `network` / `unknown` (only `unknown` is a non-fatal). Toasts: `paywall.errorNetwork`, `errorStoreUnavailable`, `errorAlreadyOwned`, `errorGeneric` |
| `ratingService.ts` | `requestNativeReview()` (auto flows; waits `REVIEW_FLOW_SETTLE_MS` = 700 ms; `review_flow_failed` on failure) / `openStoreListing({ reason })` (taps) / `isNativeReviewAvailable()` |
| `reviewPolicy.ts` | `evaluateReviewRequest` — pure decision on a rating ask: store card available → legacy opt-out → streak cap → cooldown → install age → session count → action count → strong moment → ad quiet window → the session's interruption. Every refusal carries its `reason` (`weak_moment`, `promo_collision`, `friction`, `offline`, `review_unavailable`, …) |
| `contextualPaywall/` | `index.ts` (`evaluate`, `resetSession`, `recordShown`) + `policy.ts` (pure evaluation); triggers `power_action` / `after_n_actions` / `rewarded_ad_dismissed` |
| `backendClient.ts` | `getBackendClient()` — the one axios instance for `apps/api` (`BACKEND_CONFIG` base URL, timeout, `x-api-key`) |
| `exampleService.ts` | `fetchExample({ signal })` / `fetchPremiumExample({ signal })` — `GET /example` and `GET /example/premium` through `withRetry`; the second sends `x-rc-customer-id`, and a `403` is not retried. No caller yet |

### `services/notifications/`

| File | Description |
|---|---|
| `setup.ts` | `notificationService` — `readPermission()` / `requestPermission()` → `{ isGranted, canAskAgain }`, read off the OS; foreground presentation handler (sound always on) |
| `dailyReminders.ts` | `syncDailyReminders({ group, reminders, content })` — cancels the group, then one daily trigger per `{ id, hour, minute }`; queued; resolves `'scheduled'` / `'permission_missing'` / `'failed'`, never rejects |
| `channels.ts` | `ensureNotificationChannels` creates `NOTIFICATION_CHANNEL_ID` (the id `defaultChannel` in `app.config.js` names); the one service calling `t()` |

Nothing in the starter asks for the permission or schedules a reminder; `patches/expo-notifications@0.32.17.patch` is pinned by `pnpm.patchedDependencies`.

### `services/promo/`

| File | Description |
|---|---|
| `promoCoordinator.ts` | `PromoSurface` = paywall, interstitial, consent form; `isSurfaceVisible`, `canPresentAutoPromo` / `markAutoPromoShown` (one automatic interruption per session); reset by `contextualPaywallService.resetSession()` at boot |
| `sessionSignals.ts` | `markFriction(reason)`, `hadFriction()`, `frictionReason()` — one `FrictionReason` at a time, live for `FRICTION_TTL_MS` (10 min), in memory. `SubscriptionProvider` marks `purchase_failed` and `restore_failed` |

### `services/storage/`

| File/Dir | Description |
|---|---|
| `mmkv.ts` | Main MMKV instance (id from `app.config.js`, swept by `setup.sh`) |
| `secure.ts` | Encrypted instance `entitlements` — the subscription cache and the ad-free window only; excluded from backup by `plugins/withBackupRules.js` |
| `adapter.ts` | `createMmkvStateStorage` — sync `StateStorage` for Zustand `persist` |
| `keys.ts` | All key constants (`KEYS`) |
| `domains/adFree.ts` | Ad-free window expiry (encrypted); a new reward adds to what is left, capped at `AD_REWARDED_FREE_MAX_MINUTES` |
| `domains/ads.ts` | Ad-cadence state (interstitial / rewarded cooldowns) |
| `domains/engagement.ts` | Session count, install date, paywall counter, generic action counter (`getActionCount` / `incrementAction`) |
| `domains/review.ts` | Review streak count and last request (`recordRequest`), `setArmed` / `isArmed`, `isOptedOut()` (two legacy flags nothing writes) |
| `domains/subscription.ts` | Expiry + lifetime flag (encrypted); `persistFromEntitlement`, `derive(now, gracePeriodMs)` |

---

## Hooks

| Hook | Description |
|---|---|
| `usePremium` | The subscription context: `isPremium`, `isInitialized`, `plans`, `defaultPlan`, `purchasePlan({ plan, source, surface })`, `restorePurchases({ source, surface })`, `openPaywall({ source })` (resolves `false` for a subscriber or before onboarding completes), `retryPrices`, `refreshSubscription`, `billingIssue`, `managementUrl` |
| `usePaywallPlans` | `usePaywallPlans({ source, surface })` — plan options, CTA label, trust lines, `legalNote`, `purchaseSelected` |
| `useContextualPaywall` | `maybeTrigger(trigger)` — opens the paywall at a value moment when the policy allows; refuses while `defaultPlan === null`; records the impression once `openPaywall` resolved `true` |
| `useActionRating` | `recordAction({ allowPromos })` — counts the action, offers it to the contextual paywall, then the interstitial, else arms the rating ask |
| `useRatingPrompt` | `maybeAskForRating({ moment })` — gathers the state, runs `evaluateReviewRequest`, asks for Play's card (`rating_ask_shown`) or traces `rating_ask_suppressed` |
| `useCappedByTier` | `useCappedByTier({ items, freeLimit })` → `items`, `allItems`, `limit`, `isCapped`, `canAdd` (no caller yet) |
| `useAdPlacementActive` | `useAdPlacementActive({ unitId, enabled })` — `useCanServeAd` plus the ad-free window; what `AdBanner` renders from |
| `useCanServeAd` | `useCanServeAd({ unitId, enabled })` — kill switch, configured unit, tier (store answered), consent, environment; what `AdFreeSection` renders from |
| `useAdsConsent` | The UMP snapshot (`canRequestAds`, `arePrivacyOptionsRequired`) |
| `useAdFreeRemainingMinutes` | Minutes left in the ad-free window, ticking |
| `useNotificationPermission` | `{ permission, request }` — the grant, re-read at every foreground |
| `useNetworkStatus` | `{ isOnline }` from the one NetInfo subscription (unknown = online); exports `getIsOnline` / `subscribeToNetworkStatus` |
| `useHardwareBack` | `useHardwareBack(onBack)` — the Android back key for the focused route only |
| `useStageActive` | True while the screen is focused and the app in the foreground; what `AdBanner` mounts on |
| `useSheetSnap` | `ModalBottomSheet`'s springs, snap points and dismiss pan |
| `useKeyboardHeight` | `useKeyboardHeight({ enabled })` — the keyboard's height, off its own events |
| `useResponsiveLayout` | `width`, `height`, `contentWidth`, `gutter`, `isLargeScreen` |
| `useTabBarPadding` | `useTabBarPadding(extra)` — `tabBarHeight(fontScale) + insets.bottom + extra` |
| `useScreenReaderEnabled` | `AccessibilityInfo.isScreenReaderEnabled()` + `screenReaderChanged` |
| `useProgressAnnouncement` | `useProgressAnnouncement({ progress, describe })` — announces at 25, 50 and 75 % (no caller yet) |
| `useThemedColor` | Whether the scheme on screen is dark |
| `useDebounce` | `useDebounce(value, delay)` (no caller yet) |

---

## Native: modules and config plugins

| Path | Description |
|---|---|
| `modules/app-environment/` | Local Expo module, Android only: reads the `firebase.test.lab` system setting for `adEnvironment` |
| `plugins/withAndroidSigning.js` | Release `signingConfig` from `keystore.properties`, read at build time; fails without it or EAS credentials |
| `plugins/withReleaseEnvGuard.js` | `checkReleaseEnv` before `preReleaseBuild`: runs `scripts/check-release-env.js`, which fails a release build whose embedded config sets `FORCE_FREE` / `FORCE_PRO` or `UMP_DEBUG_GEOGRAPHY` / `UMP_TEST_DEVICE_IDS`; the release workflow runs it too |
| `plugins/withGradleMemory.js` | `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m` |
| `plugins/withGradleBuildCache.js` | `org.gradle.caching=true` |
| `plugins/withCrashlyticsMapping.js` | R8 mapping upload when `CI=true` |
| `plugins/withAndroidFontFilter.js` | Keeps only `KEEP_FONTS` of `@expo/vector-icons`; fails the prebuild on a family the app imports but the list omits |
| `plugins/withBackupRules.js` | `dataExtractionRules` + `fullBackupContent` excluding `mmkv/entitlements` (+ `.crc`) and keeping `shared_prefs/expo.modules.permissions.asked.xml` |
| `plugins/withAndroidConfigChanges.js` | Adds `smallestScreenSize` to `MainActivity`'s `configChanges` |

`app.config.js` also sets `android.blockedPermissions` (`SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`), the AdMob app ids (Google's samples), `orientation: 'portrait'`, and the iOS `aps-environment` entitlement.

---

## Monetization

### AdMob

`ADS.md` is the reference. `AdBanner` per screen (reserves `AD_BANNER_RESERVED_HEIGHT` from `useAdPlacementActive`, mounts on `useStageActive`, takes the column's width), interstitial via `adService`, rewarded via `rewardedAdService` (`AdFreeSection` in Settings). Unit ids and kill switches in `constants/admob.ts` (`pickUnitId` → `null` for `UNIT_PENDING`, an empty id or a `XXXX` placeholder; `TestIds` under `__DEV__`), app ids in `app.config.js`.

### RevenueCat

`SubscriptionProvider` wraps the SDK; `applyCustomerInfo` turns every CustomerInfo (boot, foreground sync, purchase, restore) into the tier, `unverifiedFlags()` seeds it from `subscriptionStorage.derive` before the store answers. `utils/offerings.ts` (`buildOfferingPlans`, `readFreeTrial`) turns `offerings.current` into `OfferingPlan[]` (`hasTrial`, `trialDays`); `pickDefaultPlan` reads the offering's `highlightedPackage` metadata, `pickLifetimeOffer` its `lifetimePlacement` (`'exit'` by default, `'inline'`) into the context's `lifetimeOffer`. `ENTITLEMENT_PREMIUM` = `'premium'`, `PRO_BENEFITS` (one entry: the ads), `PaywallSource`, `PurchaseSurface` (`paywall`, `lifetime_offer`, `onboarding_premium`, `onboarding_exit_intent`) and the onboarding's `PurchaseOrigin` constants live in `constants/purchases.ts`. Settings carries `PremiumBanner` (joins `PRO_BENEFITS`; *Manage subscription* when `managementUrl` is non-null), `BillingIssueBanner` and `SubscriptionGraceBanner`; `PremiumGate` blurs locked content. `FORCE_FREE` / `FORCE_PRO` (`.env`, development) replace the store's answer inside `applyCustomerInfo`.

### Contextual Paywall

`contextualPaywallService.evaluate` reads `engagementStorage.getSessionCount()` (first session only), `getActionCount()` against `minActions`, and `sessionSignals.hadFriction()`. Impressions are capped for life and each arms a cooldown (`CONTEXTUAL_PAYWALL_CONFIG`).

### App Rating

`RatingMoment`s and `STRONG_RATING_MOMENTS` in `constants/rating.ts`, with the Play listing derived from the package id and `APP_STORE_APP_ID` (`null`). `RatingAskHost` (`components/rating/`) raises `action_completed` at a launch or on a return after `RATING_ASK_MIN_AWAY_MS` (5 min), `RATING_ASK_SETTLE_MS` (1.2 s) after the screen is back. `REVIEW_REQUEST_CONFIG`: 3 requests a streak, 42 then 126 days apart, `softResetDays` 180; not before 2 days since install, the second session and 7 actions; not within 2 minutes of an interstitial. `AppRatingModal` (`components/ui/`) and `SENTIMENT_GATE_ENABLED` (off) are mounted and read by nothing.

---

## Navigation

Expo Router. `RootStack` (`app/_layout.tsx`) → `(tabs)` group (`app/(tabs)/_layout.tsx`: `index`, `settings`), with `unstable_settings.initialRouteName` on `(tabs)`. `PremiumTabBar` (`components/ui/`): blur, haptics, `tabBarHeight(fontScale)`. `AppContent` renders `OnboardingScreen` until `onboardingStore.isCompleted`. `resetToHome(href?)` in `utils/navigation.ts`; `<ExitToHome />` in `components/layout/`. No stack route beside `(tabs)` ships in the starter.

---

## Onboarding

`OnboardingStepKind`s (`types/onboarding.ts`) listed by `buildSteps()` in `OnboardingScreen.tsx`; `goToStep(kind)` / `goNext()`; `BackHandler` steps back from every step but the first. Events: `logOnboardingStepViewed`, `logOnboardingBackPressed`, `onboarding_pro_detected`.

1. `WelcomeStep` — introduction; a top-left pill opens `LanguagePicker`.
2. `PremiumValueStep` — sells the default plan through `usePaywallPlans` and the paywall blocks, with a trial frieze drawn only for a free trial; `paywall.offerUnavailable` + `PriceRetryNotice` without a plan. Skip opens `ExitIntentSheet` once (`attemptedSkipTrial`), whose copy follows the default plan; leaving it, or becoming Pro on this step (an effect keyed on `isPremium`), completes the onboarding. `ProWelcomeModal` once for a subscriber met on the welcome step.

`OnboardingStepLayout` (`components/onboarding/components/`) has no caller yet. Completion: `onboardingStore.markCompleted()`.

---

## i18n

20 languages (`i18n/languages/*.json`, lazy-loaded): en, fr, es, de, pt-BR, zh-CN, zh-TW, ja, ko, ar, hi, bn, ru, id, tr, it, nl, sv, pl, vi. `ar` triggers `I18nManager.forceRTL` + restart (`RTL_RESTART_BANNER_ENABLED`): `RTLRestartBanner` counts down 15 s and restarts, or waits for *Restart now* while a screen reader is on (`rtlRestart.messageManual`); it sits above the tab bar, or above the bottom inset during onboarding. `SlidingSelector` flips its travel by `I18nManager.isRTL`; `DirectionalIcon` flips a glyph. All twenty files are at parity with `en.json`, key for key and per plural category (`rtlRestart.message` carries every form in `ar`, `ru`, `pl`).

---

## Data Fetching

TanStack Query v5: `QueryProvider` (`PersistQueryClientProvider` + MMKV persister, cache buster = app version, `PERSISTED_QUERY_KEYS` empty, `onlineManager` fed by `useNetworkStatus`, 3 retries, `isNonRetryableError` = 400 / 401 / 403 / 404 / 422 in `utils/apiErrors.ts`). `withRetry` (`utils/retry.ts`) gives up with an `ApiRequestError` (`message`, `statusCode`, `code`). Everything but `hooks/useNetworkStatus.ts` goes with `scripts/remove-api.sh`.

---

## Styling

NativeWind v4, dark mode `'class'`, `inlineRem: 15` (`metro.config.js`). `applyColorScheme` maps `'auto'` to `'system'`; `useThemedColor()` resolves the scheme. Reanimated 4 + Moti. Brand scales `accent`, `pro`, `success` in `constants/palette.js` (CommonJS) → `tailwind.config.js`, `UI_COLORS` (`constants/uiColors.ts`), `Colors.ts`. `GRADIENTS` (`constants/uiColors.ts`): `cta`, `pro`, `rewarded`, `success`, `onboardingStepLight` / `onboardingStepDark`. `UI_CONFIG.MAX_CONTENT_WIDTH` = 600.

`components/ui/`: `ScreenContainer` (edges top/left/right, centred 600 dp column), `ScreenHeading` (`mt-3.5`), `ThemedText` (variants; derives a line height for a bare `fontSize`), `GradientButton`, `AppSwitch`, `SettingsRow` (icon plate, title, description, `value`, `pro`, `accessory`, chevron, `toggle`, `disabled`), `SettingsLinkRow` (`link`, or `role="button"`), `ProBadge`, `PremiumGate`, `PremiumTabBar`, `ModalBottomSheet` (+ `modalSheet/`: `contexts.ts`, `scrollables.tsx` — `ModalBottomSheetFlatList`, `ModalBottomSheetScrollView`, `useModalSheetPanGesture()`, `dragLock`), `ModalDialog` (title, subtitle, close, body, `footer`; padded by `useKeyboardHeight()`), `WheelPicker` (`contentWidth`, `unit`, `width`; 5 rows under 700 dp), `SlidingSelector`, `DirectionalIcon`, `LanguagePicker`, `Toast` (+ `ModalToastViewport`), `OfflineBanner` (no props; mounted nowhere), `RTLRestartBanner`, `AppRatingModal`. `AppSystemBars` (in `ThemeProvider`) stacks forced navigation-bar styles.

Accessibility as implemented: `SlidingSelector` and the paywall's plans are `radiogroup`s; the language sheet's rows are radios under a labelled search field with *Clear* (`common.clear`); the tab bar is a `tablist`; the onboarding's progress bar reads `onboarding.a11y.step`; `display`, `title` and `sectionHeader` text is a `header`; the toast is an `alert` held for Android's accessibility timeout; the paywall's perks and trust lines are one element per row; `GradientButton` reads a `height` in `style` as a minimum; nothing sets `maxFontSizeMultiplier`.

---

## Known gaps

Deliberate and documented — do not "fix" them blindly. Each has its reason in CLAUDE.md or `docs/boilerplate-audit/ROADMAP.md` §4.

- **No onboarding step asks anything**: `OnboardingStepLayout` has no caller. An app's first question (its notification ask, typically) is its first caller.
- **The starter asks for no permission and schedules nothing**: `POST_NOTIFICATIONS` stays declared; the ask and `syncDailyReminders` wait for the app's first notification.
- **Remote push is not wired on the device**: `apps/api` ships the FCM sender, `@react-native-firebase/messaging` is not installed.
- **`aps-environment` is declared though nothing is pushed**: `expo-notifications` writes it whatever the config says.
- **`AppRatingModal` compiles and is mounted nowhere**; `SENTIMENT_GATE_ENABLED` is read by nothing. Bringing it back means wiring it, with the roles, states and star labels it still lacks.
- **Nothing here has been heard with TalkBack or seen at 200 %**: the roles, states and labels were written from the code. The pass on a phone is each app's, before its first release.
- **A tab label can be cut at the largest font**: `PremiumTabBar` keeps each label on one line and `tabBarHeight` adds one line's growth; a long one-word label is ellipsised, and TalkBack still reads it whole.
- **Nothing is capped, persisted or called yet**: `useCappedByTier`, `useDebounce`, `useProgressAnnouncement` and `OfflineBanner` have no caller, `PERSISTED_QUERY_KEYS` is empty, `exampleService` is the pattern a backend call copies, `PRO_BENEFITS` holds one entry.
- **The Worker's entitlement check lets everyone through** until RevenueCat's secret and project id are set, and says so in its logs.
- **The onboarding is not capped on large screens**, unlike every tab: a design pass, not a structural one.
- **Every build opens `/privacy` and `/terms` in English**, whatever its language: the site serves `/fr/privacy`, but choosing it from the app would change the paths contract.
- **`APP_STORE_APP_ID` is `null`** until the iOS release.
- **The starter ships no data migration**: it has no installs. An app porting a storage change onto a released build owes its users one.

---

## Path Aliases

`@/*`, `@components/*`, `@services/*`, `@stores/*`, `@hooks/*`, `@utils/*`, `@constants/*`, `@types/*`, `@i18n/*`, `@assets/*`. No `@providers/*` or `@contexts/*` alias — use `@/providers/*`, `@/contexts/*`.
