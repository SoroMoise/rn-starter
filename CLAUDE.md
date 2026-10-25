# CLAUDE.md

Guidance for Claude Code in this repository. This file says why, and what not to do; `apps/mobile/PROJECT_CONTEXT.md` says what exists (routes, providers, stores, services, hooks, storage keys, known gaps). Nothing lives in both: a convention lives here only. When a change alters something either documents, update it in the same change, surgically, without being asked. Both stay in English.

Also: `apps/mobile/ADS.md` (every ad placement's unit, cadence, gates and invariants; update it in the same commit as any ad change) and `docs/boilerplate-audit/ROADMAP.md` §4 (decisions already taken: read it before re-opening one).

## Project

Monorepo boilerplate for a premium React Native / Expo app (pnpm workspaces + Turborepo). Identity placeholders: `RN Starter` / `rn-starter` / `com.yourcompany.rnstarter` / scheme `rnstarter`.

- **`apps/mobile`** — Expo SDK 54 / RN 0.81.5 / React 19: AdMob, RevenueCat, contextual paywall on a generic action counter, Firebase Analytics + Crashlytics, local notifications (unwired), rating prompt, 20 languages, light/dark + RTL, onboarding (welcome → premium), open-source licences screen.
- **`apps/api`** — Cloudflare Worker (Hono), optional with `packages/shared`: `bash scripts/remove-api.sh` removes both (see Data fetching).
- **`apps/web`** — Next.js 16 static site (EN root, FR under `/fr`): home, privacy, terms.

**`scripts/setup.sh` sweeps the identity everywhere it is written and must stay exhaustive**: `app.config.js`, `constants/rating.ts`, the MMKV instance id, `apps/mobile/package.json`, the 20 translation files, `google-services.json.example`, `apps/web/lib/site.ts`, `apps/api/wrangler.toml`, the root `package.json`, and the local modules' Android package (`com.yourcompany.appenvironment`: Gradle `group`/`namespace`, Kotlin `package` and directory, the class `expo-module.config.json` registers, all moved together). It also writes the site and support address into `constants/legal.ts` and starts `.last_release_commit` at the current commit. Anything new that hardcodes the name, slug, bundle id, site or support address joins the sweep in the same change.

## Commands

Root: `pnpm dev | dev:mobile | dev:api | dev:web`, `build:web` (static export to `apps/web/out`), `android | ios`, `build`, `typecheck`, `lint`, `deploy:api`. In `apps/mobile`: `preb` / `preb:android` / `preb:ios`, `build:aab` (signed .aab), `build:install` (signed .apk on the device), `licences` / `licences:android` (rewrite the in-app licences list; the build scripts run it), `analyze` (bundle by package, `report.html`).

`ios/` and `android/` are NOT committed (CNG): `pnpm --filter mobile preb` generates them. **This stays a decision**: "never hand-edit `android/`" only holds while every prebuild regenerates it; a committed tree would need `--clean` at every change, restoring by the release workflow, and a `setup.sh` sweep.

Local native modules live in `apps/mobile/modules/` (autolinked via `expo.autolinking.nativeModulesDir`); sources committed, Gradle output (`modules/*/android/build`, `.cxx`) gitignored.

## Build & release

- **Never hand-edit `android/`**: native needs go through a config plugin in `apps/mobile/plugins/`.
- **Never `./gradlew clean`**: it cleans RN's modules under `node_modules/` (codegen included) and CMake fails far from the cause. Use `pnpm --filter mobile preb:android --clean`.
- **Release signing is `withAndroidSigning`**, reading `apps/mobile/keystore.properties` at build time. Without it the template signs `release` with the debug keystore, which Play refuses; a release with neither the file nor EAS credentials fails on purpose. `keystore.properties`, `release.keystore`, `.env` and Firebase config are gitignored.
- **A release build refuses a development override wherever built**: `withReleaseEnvGuard` runs `scripts/check-release-env.js` on `preReleaseBuild` and stops when `FORCE_FREE` / `FORCE_PRO` or a consent test aid is set (it evaluates env and config the way expo-constants does; a `.env` grep misses `.env.local`, shell vars, `KEY: value`). No bypass: a release that must show Pro gets it from a license tester's purchase.
- **`withGradleMemory`** (`-Xmx4096m -XX:MaxMetaspaceSize=1024m`: past the template's budget R8 dies quietly and `bundleRelease` fails on missing intermediates; grep "out of JVM Metaspace") and **`withGradleBuildCache`** are plugins because prebuild regenerates `android/gradle.properties`.
- **`withCrashlyticsMapping` uploads the R8 mapping only when `CI=true`** (a local build must not overwrite the live mapping; without one frames read `a.b.c(SourceFile:1)`; force with `CI=true ./gradlew bundleRelease`). Wrapped in `plugins.withId` because Crashlytics applies itself at the end of `app/build.gradle`.
- **`withAndroidFontFilter` strips every `@expo/vector-icons` font outside `KEEP_FONTS`** and refuses a prebuild that would strip one the app imports (otherwise empty squares in release). Import a family by subpath (`@expo/vector-icons/Ionicons`); the index puts all 15 families (4 MB) in the bundle.
- **A declared permission is a promise on the store listing.** `android.blockedPermissions` removes what nothing uses (`SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`); a blocked permission fails at runtime, never at build, so a feature that needs one unblocks it in the same change (a media picker needs `READ_EXTERNAL_STORAGE` up to Android 12). `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` never go on it.

### Continuous delivery

`.github/workflows/release-android.yml` fires on `workflow_dispatch` or on a PR **merged into `main` with the `release` label** (closing or merging without it releases nothing). `.github/scripts/compute-android-version.sh` derives the version from Conventional Commits since `.last_release_commit` (`feat` → minor, `!`/`BREAKING CHANGE` → major, else patch), from `const version` in `app.config.js` and its `versionCode` formula: **the two must stay in step**. The job versions, prebuilds `--clean`, signs, writes the licences list, `bundleRelease`s, uploads to the **internal** track (3 attempts, `.github/actions/publish-play/`) and pushes `chore(release): vX.Y.Z [skip ci]` with `app.config.js` and `.last_release_commit` staged by name (nothing of `android/`).

- **The PR title becomes the Play release name** (`<version> - <title>`, cut at 50 chars): lead with subject and action.
- The job **refuses** Google's sample AdMob app id, a `MOBILE_DOTENV` that forces a tier or sets a consent test aid, and placeholder legal links. The Play package id is **read from `app.config.js`**, never written in the workflow.
- If all 3 publish attempts fail, read the **first** and the job summary before re-running: an attempt can commit its Play edit and still report failure, later ones die on `apkUpgradeVersionConflict`, and a re-run recomputes the same version. Recovery: hand bump `app.config.js` and `.last_release_commit` to what Play holds.
- The bump is pushed with `GITHUB_TOKEN`, which no ruleset can exempt: on a `main` closed to direct pushes the build reaches Play and the bump is refused. A new app's first build goes up by hand.
- Secrets: `MOBILE_DOTENV`, `GOOGLE_SERVICES_JSON`, `ANDROID_KEYSTORE_BASE64`/`_PASSWORD`, `ANDROID_KEY_ALIAS`/`_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON`. The AAB is kept as an artifact only when no publish landed (`purge-artifacts.yml` clears it). The README's *Android release* section is the human half: update both.
- `ci-api.yml` lints, typechecks, dry-run builds and deploys the Worker on the `release-api` label (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`); `remove-api.sh` deletes it.

## Navigation

Root `Stack` whose first screen is the `(tabs)` group; onboarding gated in `AppContent`.

- **A screen that covers the tabs is a stack route beside `(tabs)`, never a tab** (a file in the group is a tab scene with no stack to dismiss, and `router.push` switches tabs). `unstable_settings.initialRouteName` keeps `(tabs)` under a route opened from a deep link or notification.
- **The onboarding moves by step name, never by index**: device-gated steps join `buildSteps()` after the first frame. `goToStep(kind)` / `goNext()` resolve by name; the name travels with every onboarding event.
- **A step that asks something is built on `OnboardingStepLayout`**: CTA inside the scroll view (usable at the largest font scale), pushed to the bottom (`grow`, `mt-auto`), `secondary` label and handler together.
- **The onboarding is a pager; a swipe does what the step's button does, never more.** `OnboardingPager` mounts the current step and its two neighbours; per-step UI lives in its page. A swipe forward runs the action registered via `useOnboardingForward`; a step registering none resists the drag (`OnboardingStepLayout` withdraws its CTA while disabled or while `ctaOpensDialog` would open a system dialog; `PremiumValueStep` registers nothing, since a purchase is never a swipe). A neighbour mounts ahead of its visit, so a step does nothing on mount that only a visit may do (`goToStep` logs the view). Direction flips by `I18nManager.isRTL`, never a transform.
- **Whatever owns the screen without being a route takes the back key itself** (a key left to the navigator exits the app): `OnboardingScreen` uses `BackHandler`; its sheets/modals are native `Modal`s and answer first. **A route uses `useHardwareBack(onBack)`** (a `useFocusEffect` listener; needs a navigator above it).
- **A flow that ends resets the stack; never `replace` home**: `router.replace('/')` leaves earlier screens under Home. Use `resetToHome(href?)` (`utils/navigation.ts`); a route whose session is gone returns `<ExitToHome />`, never `<Redirect href="/" />`.
- **The onboarding ends on the entitlement, never a purchase call**: `purchasePlan()` resolves before React commits the tier, and a restore has no callback. An effect keyed on `isPremium` completes the flow on the premium step and shows `ProWelcomeModal` once on an earlier one.

## State and storage

Zustand v5; persisted stores use `persist` + MMKV (`mmkvStateStorage`) and hydrate synchronously at module import: no async gate, no forced rehydration at boot. The onboarding's current step is never persisted.

- **MMKV is the only key-value store; AsyncStorage does not come back** (it puts the boot gate back). `persist` wraps values in `{ state, version }`: a hand-written value under a store's key rehydrates to defaults; read from outside Zustand like `getActiveLanguageFromStorage` (`i18n/service.ts`).
- **What a store's `merge` decides stays in memory until something writes it** (`persist` writes on `setState` only), so the symptom lands one launch after its cause. A store whose `merge` changes what was on disk raises a module flag and forces one write after hydration:

  ```ts
  onRehydrateStorage: () => () => {
    if (!mergeResolvedSomething) return
    mergeResolvedSomething = false
    queueMicrotask(() => useStore.setState({}))
  },
  ```

  The microtask is not optional (MMKV hydrates inside `create()`, before `useStore` is assigned). Normalise transient state in `partialize`. Neither starter store needs the flush.
- **What grants something lives in its own encrypted instance only** (`secure.ts`: subscription cache, ad-free window). Obfuscation, not secrecy. The key's first 16 bytes are read and the key never changes once released. **Never encrypt the main instance.** A port onto a released build copies plaintext values across once, at import.
- **No copy of that instance leaves the device**: `withBackupRules` excludes `mmkv/entitlements` (+ `.crc`) from cloud backup and device transfer (`dataExtractionRules`, `fullBackupContent`) and keeps expo-modules-core's record of permissions asked. Anything else a day-stale snapshot would resurrect is a separate decision.
- **The action counter is fed by `recordAction()` (`useActionRating`), never `incrementAction()` alone**, and never reset (cooldown and lifetime cap pace it).
- **A rewarded video watched during an ad-free window adds to what is left**, up to `AD_REWARDED_FREE_MAX_MINUTES`.
- **A last-used setting is remembered per feature, never by default**: a choice made the same way every time (export format, brush size) gets its own storage domain; one taken from what is in front of the user (crop, tool) goes with the screen. A remembered setting a tier gates is a preference, not an entitlement, and is clamped on every read. The starter remembers theme and language only.

## Services and analytics

`apps/mobile/services/api/` holds SDK wrappers and pure policies. `backendClient` throws by name when `.env` lacks `BACKEND_URL` or `BACKEND_API_KEY`.

**A screen view is the route's pattern, never its pathname.** `TelemetryEffects` logs `useSegments()` without groups (`/reading/[id]`), and `/onboarding` while onboarding owns the screen; never `usePathname()` (double-counts, and a dynamic value would reach Analytics/Crashlytics). A route whose own name is sensitive takes a dynamic segment (`add/[kind]`), not one static file per value.

### Notifications (`services/notifications/`)

The starter asks for nothing and schedules nothing.

- **The feature that needs the permission asks, where the user sees what it buys**, never at launch or from a scheduling path. `POST_NOTIFICATIONS` stays declared (Android 13+ drops notifications silently otherwise). A toggle defaulting to on can't be what asks; a refusal writes the intention back to off. After a permanent denial, `Linking.openSettings()`.
- **Whether to ask is the OS's answer, never an app flag** (the main instance rides backup; expo-modules-core's `shared_prefs/expo.modules.permissions.asked.xml` is kept on the device by `withBackupRules`).
- **The scheduler never asks and never fails quietly.** `syncDailyReminders` cancels its group then schedules one trigger per entry, queued so the latest call holds; no grant → `'permission_missing'`; native failure or out-of-range time (validated before cancelling) → `'failed'` + non-fatal, never a rejection. The syncing effect depends on the grant as well as the list; title/body freeze at scheduling, so a language change re-syncs. Reminders are inexact (Play grants `USE_EXACT_ALARM` to alarm/timer/calendar apps only).
- **A channel's sound is frozen at creation.** A channel that must sound differently takes a new id (`defaultChannel` in `app.config.js` follows, the old one is deleted, triggers rescheduled). The foreground handler always asks for the sound (`shouldPlaySound: false` also drops the heads-up banner).
- **Remote push is not wired** and `@react-native-firebase/messaging` is not installed. Adding it means the package, a handler at the JS entry (never a lazy route) and a token registered with the backend.
- **`expo-notifications` carries a patch that must survive every bump** (`patches/expo-notifications@0.32.17.patch`: try/catch in `NotificationForwarderActivity.onCreate`, OEM ROMs drop the extras). `pnpm.patchedDependencies` pins the version; re-cut on a bump. It always writes the `aps-environment` entitlement (declared in `app.config.js`; the App ID needs Push Notifications or iOS signing fails).

### Promo coordination (`services/promo/`)

- **`promoCoordinator` is the single authority over interruptive surfaces** (`PromoSurface`): no stacking (`isSurfaceVisible`) and **one automatic interruption per session, all types** (`canPresentAutoPromo` / `markAutoPromoShown`). User-opened paywalls and the consent form register visibility but spend no budget. A new surface is a `PromoSurface` member and its setter.
- **A failure the user just met mutes automatic promos**: `sessionSignals` holds one friction for `FRICTION_TTL_MS` (10 min); the contextual paywall and rating ask refuse as `friction`. Mark a purchase/restore that failed for a reason other than the user's own (cancelled sheet, pending payment) where the failure is shown; not a failed price load, boot sync or `configure`. An app marks its own failures with a `FrictionReason` and `markFriction(reason)`. No `resetSession()`: the process is the session.

## Data fetching

TanStack Query v5 in `QueryProvider` (`PersistQueryClientProvider`, MMKV persister, app version as cache buster).

- **Nothing is persisted until you say so**: `PERSISTED_QUERY_KEYS` is empty until an app adds prefixes.
- **Connectivity is the app's own, whatever the backend.** `useNetworkStatus` holds the one NetInfo subscription (`getIsOnline()` / `subscribeToNetworkStatus()` outside React), reads "unknown" as online, and feeds `onlineManager` (RN has no browser `online` event), the rating ask and `OfflineBanner`. A query retries ≤3 times and never a status that can't succeed (`isNonRetryableError`, `utils/apiErrors.ts`, shared with `withRetry`). Connectivity never decides the entitlement. A networked screen mounts `<OfflineBanner />`, never its own NetInfo read.
- **An app with no backend runs `bash scripts/remove-api.sh`**: removes `apps/api`, `packages/shared`, `ci-api.yml`, Worker scripts/turbo task and build allowances (`esbuild`, `workerd`), `QueryProvider`, `@tanstack/*`, `axios`, `withRetry`, `utils/apiErrors.ts` + their `error.*` keys, `backendClient`, `exampleService`; keeps `useNetworkStatus` and netinfo. It refuses a dirty tree and regenerates the licences list. **Anything added only for the backend joins its list in the same change.**
- **`withRetry` is for calls outside a query**; a `queryFn` calls `getBackendClient()` directly (or attempts multiply). It throws `ApiRequestError` (`statusCode`, `code`): branch on those, never the translated message.

## Monetization

- **AdMob** (`ADS.md`): lazy-init, off when premium or ad-free. `AdService.setPremium` has one writer, `SubscriptionProvider`.
- **AdMob ids are literals, never `.env`, and a pending unit requests nothing.** App ids in `app.config.js` (Google's sample until the app has its own; the SDK crashes with none), unit ids and kill switches in `constants/admob.ts` (an incomplete env once shipped empty ids: no ad, no error). `pickUnitId` resolves a pending unit to `null`. Never lend a pending placement another's unit (revenue is reported by unit). `__DEV__` always resolves to `TestIds`.
- **An action is counted first, then offered to one promo, in fixed order**: `recordAction()` increments the counter, offers the moment to the contextual paywall, then the interstitial (only an ad the user saw takes it), then arms the rating ask. First to take it ends the chain; all share the session's single interruption. The paywall comes first because it earns: don't flip it. `{ allowPromos: false }` counts a moment that must not be interrupted (first success, abandoned/failed action); `{ allowInterstitial: false }` lets the paywall but not the ad (action repeated inside a flow).
- **A health or other sensitive audience gets non-personalized ads only**: `AD_NON_PERSONALIZED_ONLY` (`constants/admob.ts`) forces `AD_REQUEST_OPTIONS` non-personalized whatever consent allowed, `apps/mobile/firebase.json` turns off Analytics ad-personalization signals and adid collection, and the site's privacy policy is rewritten in the same change (`ADS.md` §9). No reading, value or condition reaches an ad or analytics SDK.
- **The interstitial settles when it closes**: `showInterstitialAd()` resolves `true` on `CLOSED`, `false` on `ERROR`, a rejected `show()` or no `OPENED` within `PRESENTATION_TIMEOUT_MS` (a raised visibility flag would freeze every automatic promo). Failed instances are replaced; a late ad still pays its slot/reward on `onEnd`. Only a closed ad resets the cadence. Consent is re-read at show time.
- **One predicate decides whether a placement runs**: `useAdPlacementActive({ unitId, enabled })` feeds `AdBanner` and the screen's reserve (`useAdBannerReserve({ isBannerVisible })`). **The room follows the banner, never a constant**: `AdBanner` reports the measured height (`onSizeChange`) into `adBannerStore`; `AD_BANNER_RESERVED_HEIGHT` (60) is only the pre-measure stand-in. The rewarded offer reads `useCanServeAd` (every gate but the ad-free window).
- **A banner is mounted once per visit and unmounted on blur** (`useStageActive` in `AdBanner`); refreshing or rebuilt banners are impression inflation. A native `Modal` over the screen leaves it mounted and covered, on purpose.
- **Nothing requests an ad on a Firebase Test Lab device** (invalid traffic → suspension): `modules/app-environment` reads `firebase.test.lab`; `adsAllowedInEnvironment()` gates the banner, both ad services and consent.
- **Nothing requests an ad before consent.** `consentService` runs UMP and is the **only** caller of `mobileAds().initialize()`; default `canRequestAds: false`; the form is gathered at the frame onboarding ends on, never earlier, never for a subscriber. Where `arePrivacyOptionsRequired`, Settings shows a row to reopen it. `UMP_DEBUG_GEOGRAPHY` / `UMP_TEST_DEVICE_IDS` (`.env`, `__DEV__` only) are refused by release builds.
- **RevenueCat**: `ENTITLEMENT_PREMIUM` (`constants/purchases.ts`) is hardcoded on purpose; SDK keys come from `.env`. `openPaywall({ source })` from `SubscriptionProvider`.
- **`FORCE_FREE` / `FORCE_PRO` override the tier for dev and write nothing** (read inside `applyCustomerInfo`, never reaching `subscriptionStorage`); `FORCE_FREE` wins. Release builds refuse either.
- **`openPaywall` is the single choke point**: it resolves `false`, opening/tracking nothing, for a subscriber and until onboarding completes. Surfaces still hide their own offer from a subscriber. The contextual paywall records its impression only after `openPaywall` resolves `true`.
- **The offer is data, not code**: product ids, prices, periods, trial and plan count come from `offerings.current` (`buildOfferingPlans` → `OfferingPlan[]`); surfaces render from `usePremium().plans`/`defaultPlan`, phrase through `usePaywallPlans({ source, surface })` and buy through `purchasePlan({ plan, source, surface })`. Never hardcode a product id, a monthly+annual pair or a trial length. Only `offerings.current` is read.
- **The paywall is built from reusable blocks** (`components/paywall/`) over `usePaywallPlans`; `PaywallTrustRow` states only what holds for the selected plan.
- **A one-time purchase is offered when the subscription is turned down, never beside it**: `pickLifetimeOffer` takes it out of `usePaywallPlans().options`; the paywall's first close raises `LifetimeOfferCard` (once per opening). It stays listed when offering metadata sets `lifetimePlacement: 'inline'`, when the offering highlights it, or when nothing recurring is left. The card states its charge (`legalNote`), no urgency, no break-even claim; purchases carry `surface: 'lifetime_offer'`.
- **`PremiumGate` blurs what it locks**: `BlurView` + 0.55 veil with `experimentalBlurMethod="dimezisBlurView"` (required on Android; it samples the screen the gate sits in, so inside a native `Modal` it would blur the screen under it). Locked content leaves the accessibility tree (`no-hide-descendants`); the unlock button is the only stop, so callers pass an `accessibilityLabel` ("Insights. Unlock with Pro").
- **Every buy button states its charge beside it** (`usePaywallPlans().legalNote`: price, period, trial length and what it becomes), per Play's subscriptions policy. Exit-sheet copy follows the default plan, never a literal "7 days free".
- **Every funnel step says where it came from**: `source` (`PaywallSource`; a new spelling splits the funnel silently) and `surface` (`PurchaseSurface`) ride on every `purchase_*`/`restore_*` event with `product_id`, `offering_id` and `currency`. `paywallAnalytics` composes the events; a surface that sells without `openPaywall` passes its own `PurchaseOrigin`.
- **The purchase's own answer is the answer**: no throw ≠ granted. A purchase that resolves without `ENTITLEMENT_PREMIUM` (product never attached, template id left) is `purchase_failed` (`entitlement_inactive`) + a non-fatal naming active entitlements.
- **Failures are classified by code; only the unknown is a non-fatal** (`purchaseService.reportFailure`, never by translated message; known reasons are breadcrumbs). Every provider catch goes through it. Ad failures likewise via `reportAdFailure`.
- **Nothing interruptive fires without an offer, and an empty offer says so**: `useContextualPaywall` refuses while no plan has loaded (`isInitialized` is true even when `getOfferings()` failed). Selling surfaces show `paywall.offerUnavailable` + `PriceRetryNotice` (`retryPrices()`), never a disabled button over a missing price.
- **Entitlement and prices are two independent calls** with their own error boundaries (never one `try` around `Promise.all`). Offerings refetch on foreground. A `configure` that throws ends price loading; `retryPrices`/`refreshSubscription` restart the store, a foreground doesn't.
- **A free trial is only a trial when `introPrice.price === 0`, length off the product** (`readFreeTrial` → `hasTrial`/`trialDays`). Badge, CTA and onboarding frieze render from those, and promise only what happens on its own, never a reminder nothing sends.
- **No social proof the store can't back** (no rating or user count on the paywall) and **no urgency the store doesn't enforce**.
- **One list sells Pro and names only what the free tier can't do**: `PRO_BENEFITS` (`constants/purchases.ts`) feeds `PaywallPerks` and Settings' banner; each entry is a limit the free tier enforces, added with its gate. Key a build-dependent benefit off what delivers it, never `Platform.OS`. Interpolate a limit as `limit`, never `count` (i18next plural).
- **A free-tier limit applies on read, never on write**: the store keeps everything; `useCappedByTier({ items, freeLimit })` returns what the tier allows, read by every screen, sync and scheduler. It reads the cached tier and never waits on `isInitialized`. A remembered setting outliving its gate is clamped on every read. The starter caps nothing yet.
- **Contextual paywall**: fires at a value moment once the action count reaches `minActions`; the session count only holds it back in the first session. Never at launch, never while a friction is live. `rewarded_ad_dismissed` follows only a video closed before its reward.
- **The grace period after a failed payment is the store's**: no local window. `persistFromEntitlement` writes only what the store answered; `BillingIssueBanner` is informational. `PremiumBanner` shows *Manage subscription* only when `purchaseService.managementUrl` is non-null.
- **`subscriptionStorage.derive(now, gracePeriodMs)` is the offline allowance**, read only through `unverifiedFlags()`: to seed the tier before the store answers and in the `catch` of a `getCustomerInfo` that couldn't reach it (`SubscriptionGraceBanner`). Never where the store answered. A failed request is the offline signal, never a connectivity flag.
- **`applyCustomerInfo` is the single place a CustomerInfo becomes the tier** (boot, foreground, purchase, restore).

## App rating

- **Play forbids pre-filtering the review**: a qualifying moment calls `requestNativeReview()` and Play's card is the whole ask. `AppRatingModal` compiles, is mounted nowhere, beside `SENTIMENT_GATE_ENABLED` (off, read by nothing): bringing it back means wiring it.
- **One pure policy decides and names every refusal**: `useRatingPrompt().maybeAskForRating({ moment })` → `evaluateReviewRequest` (`reviewPolicy.ts`) asks or tracks `rating_ask_suppressed` with a `reason`. A `RatingMoment` is where the app just delivered something, never a step inside a task; only `STRONG_RATING_MOMENTS` open the card. The ask spends the session interruption (`promo_collision`) but registers no visibility. Friction → `friction`, offline → `offline`.
- **An action arms the ask; the user's return raises it**: `recordAction()` only arms (`reviewStorage.setArmed`); `RatingAskHost` raises `action_completed` at a launch or a return after `RATING_ASK_MIN_AWAY_MS`, `RATING_ASK_SETTLE_MS` after the screen is back (Android reports ads, billing sheet and Play's card as backgrounds). Arming lasts until the ask launches or a refusal outlives the session (`refusalOutlivesSession`). The host mounts only after the session starts.
- **Two store paths, not interchangeable**: `requestNativeReview()` for automatic flows only (undocumented, silent quota; never behind a button), waits `REVIEW_FLOW_SETTLE_MS` on a plain timer (not `InteractionManager`) and asks nothing once the app left the foreground (the library throws beyond any JS catch without an activity). `openStoreListing({ reason })` serves every explicit tap. Review-flow errors are neither shown nor allowed to change the flow; a device with no store card is `review_unavailable` before any budget is spent. App Store needs `APP_STORE_APP_ID` (`null` until iOS).
- **No event can mean "the user rated"**: `rating_ask_shown` = a moment qualified; `review_flow_launched` = the API was called; `likely_displayed` is a dashboard heuristic. Truth is the Play Console count.
- **Attempts are spaced, never spent once**: `reviewStorage.recordRequest` records an attempt. `softResetDays` **must** stay above `cooldownDays × backoffMultiplier^(requestCap − 1)` or the cap never binds. `isOptedOut()` still reads the old star-gate flags; nothing writes them.

## Brand and legal

- **Every brand image is drawn from one mark by `scripts/generate-brand-assets.py`** (`pip install pillow`): edit the script, never a PNG. Constraints: store icon full bleed RGB; adaptive foreground over transparency at two thirds; splash over transparency (Android 12+ circles it); notification icon a pure white silhouette. The script's `BACKGROUND` equals `splash.backgroundColor` and `android.adaptiveIcon.backgroundColor`: change together. The shipped mark is a placeholder.
- **Legal links are constants, never env**: `constants/legal.ts` builds `LEGAL_URLS` from `APP_WEBSITE_URL`, opened from Settings and beside every buy button. The release workflow refuses placeholders until `setup.sh` writes the app's own. **`/privacy` and `/terms` are a contract with every installed build**: never renamed, translated or locale-prefixed; a domain move edits the constant and `SITE.url` (`apps/web/lib/site.ts`) together.
- **Open-source notices ship inside the app and their list is generated, never written** (`licences` route, offline, texts verbatim). `scripts/generate-licences.mjs` writes `constants/licences.generated.json` from: the bundle's npm packages off `expo export`'s source map (not a checker over `node_modules`), autolinked native packages, C/C++ in the `.so` files (RN/MMKV plus libraries vendored under a local module's `third_party/<lib>/` with a `NOTICE.md`: `# Name`, `- Licence:`, `- URL:`, plus `- Version:`/`- Text:` when its licence isn't in `COPYING`/`LICENSE`), fonts (one entry per family under `assets/fonts`, named off the name table), and with `--android` Gradle's `releaseRuntimeClasspath`. Never hand-edit the JSON or drop the generation from `build:aab`, `build:install` or the release workflow. Missing texts are fetched once with `--fetch` into `scripts/licences/texts/` and committed. The generator fails on what it can't read (vendored library without its own folder/`NOTICE.md`, font without licence text or readable name, unrecognised licence, kept icon family missing from `ICON_FONT_TEXTS`). A C++ library RN starts compiling in joins by hand.

## Layout and styling

NativeWind v4, dark mode `'class'`. `GradientButton` for primary CTAs. Reanimated 4 + Moti.

- **One surface owns the bottom inset, and on a tab it is the tab bar.** `PremiumTabBar` is absolute and pads by `max(insets.bottom, 8)`, so `ScreenContainer` runs `edges={['top','left','right']}`. Bottom-anchored content adds the inset via `useTabBarPadding()`. A stack route has no tab bar: its controls add `insets.bottom` themselves. Sheets are their own window and add no bottom padding (content owns `insets.bottom`; a fixed `pb-8` buries the last row under a three-button bar).
- **A large screen gets a centred column, never a second one.** Android 16 ignores `screenOrientation` above 600 dp; the portrait lock stays. `ScreenContainer` caps content at `UI_CONFIG.MAX_CONTENT_WIDTH`; anything outside it caps itself (a native `Modal` is its own window). The anchored banner is handed the column's width. Nothing inside the column is sized from `useWindowDimensions().width` (use `onLayout`); never `Dimensions.get()` at module scope. `useResponsiveLayout()` covers what a style can't express.
- **Resizing must never recreate the activity**: `withAndroidConfigChanges` adds `smallestScreenSize` to `MainActivity`'s `configChanges` (the Expo template omits it; a destroy-without-finish crashes with a sheet open).
- **A rem is 15 dp** (`inlineRem: 15` in `metro.config.js`). NativeWind's 14 renders everything at 7/8; 16 read as zoomed. Don't drop the option or raise it to 16 without a device check.
- **A style that can be a class is one**, so the UI follows the rem: `inlineRem` converts `rem` only; a `style` value or arbitrary px class stays fixed. Scale sizes take their named class; others an arbitrary rem (`w-[2.875rem]`, px ÷ 16); a text size stays `text-[Nrem]` where it overrides a `ThemedText` variant. Px stays for: minimum touch targets (`min-h-[44px]`), border widths, and anything JS positions from. A `text-*` class carries its line height (`leading-[Nrem]` to keep an old one). `style` stays for Reanimated styles, runtime numbers (insets, measured sizes, `UI_CONFIG.MAX_CONTENT_WIDTH`), non-style props (icon `size`/`color`, `LinearGradient colors`), components with no `className` (`LinearGradient`, `BlurView`, `GradientButton` reads `height`/`borderRadius` from `style`), custom shadows, `fontVariant`, `direction`. `createAnimatedComponent` wrappers take a class as is (`AnimatedPressable`); **never wrap one in `cssInterop`** (it folds class and animated style into one object Reanimated reduces to animated values; the plan cards lost their layout that way).
- **The theme setting stores an intention, never a scheme**: `DEFAULT_SETTINGS.theme` is `'auto'` (mapped to `'system'` by `applyColorScheme`); read the scheme on screen via `useThemedColor()`, never `settings.theme`.
- **Brand colours are roles, never hues**: `constants/palette.js` (`accent`, `pro`, `success` scales; stays CommonJS for `tailwind.config.js`) feeds the Tailwind config, `UI_COLORS` and `Colors.ts`. A hue in a component (`bg-blue-500`, `'#8b5cf6'`) is the one place a rebrand misses. Status colours keep Tailwind names.
- **Readable colour is chosen by step**: meaningful text/icons take 700+ in light, 400− in dark (a step further on tinted surfaces), never 500; a fill under white text takes 600+ in both themes (emerald from 700), and so does every gradient stop under white text; non-text state (switch track, radio ring, progress fill, selected border) reaches 3:1 against its surface. Gray text is 500+ on white/gray-50, 400− on gray-800/900; `muted` is gray-600 (gray-500 is 4.63:1 on gray-50 and falls under 4.5 on tints), `subtle` its alias. No text under 4.5:1 on its background; a decorative icon may stay at 500 where it holds 3:1.
- **Every tab shares one gutter and heading line**: `paddingHorizontal: 20` on the `ScrollView`'s content container (never a margin on the scroll view, nor per block) and `ScreenHeading` at `mt-3.5`.
- **A screen that forces the system bars hands them back**: mount a second `AppSystemBars` with explicit styles; it stacks forced navigation styles itself (last mounted wins).
- **A font size raised from `style` takes its line height with it**: `ThemedText` derives one; a plain `Text` doesn't — set both.
- **Silent traps:**
  - Inside a vertical scroll, nothing grows to fill a parent with only a minimum height and no height is a percentage (Yoga measures against the rest of the viewport: a `GradientButton` becomes half a screen). `GradientButton` draws its gradient as an absolute fill behind sizing content; its `gradientStyle` never carries a height.
  - **A `Pressable` never takes a `style` function** (NativeWind drops it: radius, margins and press feedback vanish). Use a class variant (`active:scale-[0.98]`) or `onPressIn`/`onPressOut` state.
  - **State variants (`active:`, `hover:`, `focus:`) go on the `Pressable` itself, never a child `View`** (NativeWind makes it a `Pressable` that wins the responder; `onPress` never fires).
  - **A horizontal `ScrollView` inside a column takes `flexGrow: 0`.**
  - **A `BlurView` passes `experimentalBlurMethod="dimezisBlurView"` and pays for it** (re-blurs its nearest `Screen` on redraw). `PremiumTabBar` pays on purpose; if it shows in a trace, drop the prop there first.
- **Gradients are tokens** (`GRADIENTS`, `constants/uiColors.ts`) named by role; `pro`, `rewarded`, `success` take stops from `palette`; `cta` and onboarding backgrounds are hand-drawn. Keep the `satisfies Record<string, readonly [string, string, ...string[]]>`.
- **Toasts go through `ToastProvider`**; over a native modal mount `ModalToastViewport active={visible}` inside it.
- **`ModalBottomSheet` is assembly only** (`useSheetSnap` owns springs/snaps/dismiss pan). A scrollable that is neither (wheel, carousel) reads the pan via `useModalSheetPanGesture()` and blocks it with `Gesture.Native().blocksExternalGesture(pan)`. Content that drags raises `dragLock`; a pan it held springs the sheet back rather than dismissing.
- **A dialog is `ModalDialog`**, `footer` outside the body. **The keyboard doesn't resize a native modal on Android** (edge-to-edge), so `ModalDialog` pads by `useKeyboardHeight()`; a `KeyboardAvoidingView` inside a `Modal` doesn't cover it. Sheet and dialog mount their own `GestureHandlerRootView` (gestures in a native modal need a root view in that window).
- **A view setting its own height from a measurement of its content ignores a report within a pixel of the height it just set** (Yoga rounding echoes noise on non-integer densities and the view shivers). The starter has none yet; the first carries the guard.
- **A settings row is `SettingsRow`, the whole row the touch target**: a switch row passes `toggle` and draws `AppSwitch` (a decoration) under `accessibilityRole="switch"`; a row with neither `onPress` nor `toggle` is information; `disabled` when it can't act. `SettingsLinkRow` is a title and chevron (`link`, or `role="button"` when it opens something in-app).
- **`WheelPicker` is turned with a thumb**: its touch column is wider than its digits, `unit` inside with `pointerEvents="none"`. Don't narrow columns or leave a gap. Inside a sheet the wheel blocks the pan.

### Bundle size

The JS bundle is part of the Play download and Metro doesn't tree-shake: run `pnpm --filter mobile analyze` before and after dependency changes.

- The licences list (~230 KB) is required on first use of the licences screen (`loadLicences()`, `services/licences.ts`), never imported at a module top.
- `date-fns` per function (`date-fns/format`), never the index (~250 KB).
- `@revenuecat/purchases-js-hybrid-mappings` resolves to an empty module on `android` and `ios` by name (`metro.config.js`), never `platform !== 'web'` (web's only purchase path is that SDK; Metro can resolve with no platform).
- Moti costs ~250 KB (framer-motion) for six entrances; it stays in the starter. An app using it only for entrances replaces it with a Reanimated-only view, and doesn't bring it back.

## Accessibility

- **Every control says what it is, its state and what it does; nothing else is a stop.** A pressable carries a role (`button`; `link` for what leaves for a page/site; `radio` in a `radiogroup`; `switch`, `tab`, `adjustable`), a name (text, or an i18n `accessibilityLabel` for icon-only), its state (`checked`, `selected`, `disabled`, `busy`, `expanded`) and an `accessibilityValue` for sliders/running tasks. Headings are `ThemedText` in `display`/`title`/`sectionHeader` (they carry `header`). Decorative icons are hidden (`importantForAccessibility="no"`) or their row is one `accessible` sentence. A row showing a value without acting is a `View`, never a handler-less pressable. A sheet's backdrop is not a control; the first stop is its title.
- **Nothing acts on a timer while a screen reader is on**: a countdown ending in an action waits for the tap (`useScreenReaderEnabled()`) and a reader turned on mid-countdown stops it. Self-dismissing messages last `AccessibilityInfo.getRecommendedTimeoutMillis`.
- **Progress is announced politely, not per tick**: never a live region for fast-changing values; a running task is a `progressbar` announced each quarter (`useProgressAnnouncement`); a task that ends is announced once.
- **No font-scale cap, ever** (`maxFontSizeMultiplier`, `allowFontScaling={false}` never appear; Android reaches 200 %). A height around text is a minimum (`GradientButton` reads `style.height` as one), labels wrap (`numberOfLines` only where an ellipsis loses nothing), text sharing a row with a control shrinks, screens with bottom actions scroll, the tab bar grows (`tabBarHeight(fontScale)`).

## Internationalization

20 languages (`i18n/service.ts`, `i18n/languages/`, lazy-loaded): en, fr, es, de, pt-BR, zh-CN, zh-TW, ja, ko, ar, hi, bn, ru, id, tr, it, nl, sv, pl, vi. RTL (`ar`) → `I18nManager.forceRTL` + restart.

- **RTL mirrors the layout, never a transform**: a `translateX` still moves right in Arabic. Keep a sliding indicator's position logical and flip its travel by `I18nManager.isRTL` (`SlidingSelector`); flip directional glyphs by hand (`DirectionalIcon`).
- **`common.*` is the shared UI vocabulary**, the one namespace that may hold a key with no reader. Elsewhere an unread key is dead and goes.
- **Policy**: feature work provides **EN and FR only**; the other 18 are translated in **dedicated sessions**, never alongside features. A session brings every language to full parity with `en.json`: key for key, one value per plural category (`ar` 6; `ru`, `pl` 4; `fr`, `es`, `it`, `pt-BR` 3; `ja`, `ko`, `zh-*`, `id`, `vi` 1; others 2; `Intl.PluralRules(locale).resolvedOptions().pluralCategories`). `fallbackLng: 'en'` hides a gap as half-translated screens. A string interpolating `count` is a plural. Translations are adapted, not literal.
- **One register per language, the whole app, onboarding included.** Formal: fr `vous`, ru `вы`, tr `siz`, id `Anda`, hi `आप`, bn `আপনি`, ar, zh-CN/zh-TW `您`, ja です・ます, ko. Informal: es `tú`, de `du`, it `tu`, nl `je`, pl `Twój`, pt-BR `você`, sv, vi `bạn`. An app may flip a language, but its whole file at once.
- No "successfully"/"avec succès", no "Please"/"Veuillez" before a recovery action, no "Are you sure you want to…". Say what happened or what the next tap does. Errors name the problem in the user's terms, not the transport's (`server error`, `rate limit`, `timeout`).
- EN labels are sentence case (proper nouns keep capitals). Clause separator `·`, ellipsis `…`.
- Aliases (`apps/mobile/tsconfig.json`): `@/*`, `@components/*`, `@services/*`, `@stores/*`, `@hooks/*`, `@utils/*`, `@constants/*`, `@types/*`, `@i18n/*`, `@assets/*`; providers and contexts import as `@/providers/*`, `@/contexts/*`.

## API (`apps/api`)

Hono: `GET /health` (open), `GET /example`, `GET /example/premium` (`403 premium_required` for free). On `/example/*`: `rateLimiter` (30 req/IP/60 s) then `apiKeyAuth` (`x-api-key`). `Env` (`src/types.ts`): `API_KEY`, `FIREBASE_*`, `REVENUECAT_SECRET_API_KEY` (secret), `REVENUECAT_PROJECT_ID` (`[vars]`), `API_RATE_LIMITER`, `ENTITLEMENT_CACHE` (KV).

**The server decides who is premium.** `entitlementContext` (`middleware/premium.ts`) reads `x-rc-customer-id`, resolves the tier once via `isPremiumCustomer` (REST API v2) and hands `isPremium` to the route.
- The id's **format** is checked, not its owner (`CUSTOMER_ID_RE`): the API key ships in the APK; an anonymous id can't be guessed.
- **Unknown is not "no"**: RevenueCat not answering is `503 entitlement_check_unavailable`.
- **Inert until configured**: without `REVENUECAT_SECRET_API_KEY` and `REVENUECAT_PROJECT_ID` every caller is premium (logged once). The app's `FORCE_PRO` never reaches it.
- Answers are cached in `ENTITLEMENT_CACHE` (yes ≤6 h and never past expiry; no 60 s); `wrangler.toml` has no namespace id, the first deploy creates it.
- **One entitlement, or a filter**: v2 names an entitlement by internal id, so any active entitlement counts as premium; an app selling a second filters `entitlement_id` in `resolvePremium`. No server grace window.

## Web (`apps/web`)

Next.js 16 App Router, **static export** into `apps/web/out/`. The host must serve `/privacy` from `privacy.html` (Firebase Hosting needs `cleanUrls: true`) and send the security headers (an export ignores `headers()`); the README lists both. English sits at the root.

- **Every URL comes from `lib/routes.ts`**; legal slugs are identical in every locale (`/fr/privacy`).
- **Each locale is its own root layout** (only a root layout renders `<html lang>`); `app/not-found.tsx` renders its own document.
- **Copy lives in typed dictionaries** (`content/{en,fr}/`), French checked against English's types. EN and FR only.
- `lib/site.ts` holds the identity (swept by `setup.sh`); legal pages print a template notice while a bracketed placeholder or `example.com` remains.
- **The privacy policy describes what the starter does** and changes in the same commit as a new SDK, permission or data sent to a server. The site sets no cookie and loads no web font, analytics or third-party script.
- **No `aggregateRating` and no `offers` in JSON-LD.**
- **The site shares the mobile app's React, to the version** (`node-linker=hoisted`): `react`/`react-dom` in `apps/web/package.json` pin the mobile's exact version. Any package both resolve follows the rule, hence plain CSS with `light-dark()` tokens and no Tailwind v4 beside NativeWind's v3.
- Favicon and home-screen icon come from `scripts/generate-brand-assets.py`. The Android release workflow installs the whole workspace and builds none of the site.

## Store policy

What costs a rejected release or suspended account. Most sits beside its code (pre-filtered review, social proof, charge beside buy buttons, ad consent and Test Lab, declared permissions, `aggregateRating`). Two have no code to sit beside:

- **No urgency the store doesn't enforce**: a countdown, "today only" or "last chance" over an unchanging price is false scarcity (Play policies, EU Unfair Commercial Practices Directive). Only when a real store offer ends, and it states the date.
- **A declaration is a form, not a design constraint**: where Play restricts a permission to certain app kinds, eligibility is a product decision taken once and the declaration filed at submission. Never narrow a feature or drop an API because "Play requires a declaration". What binds is an in-app disclosure in plain words before the system dialog, and a configuration no wider than the need.

## Testing

**No tests.** Do not write, suggest or run tests, nor add test files or testing libraries.

## Code style

- **Zero comments by default.** A design choice, naming rationale or "why it works" narration isn't reason enough, even if true. Keep a comment only for what the code can't say: a crash/OOM history, a security boundary, a store/legal constraint (Play, GDPR/UMP), or a platform/library trap (RN, NativeWind, Reanimated) that breaks silently once "simplified"; name the constraint and what breaks. Never what-comments, task traces, restatements, or repeats of an explanation at the definition.
- **Three layers**: `services/` (storage, SDKs, pure policies; no React, `router` or `t()`), `hooks/` (React orchestration), `app/` + `components/` (assembly, JSX). `reviewPolicy.ts` and `contextualPaywall/policy.ts` are the shape: a pure decision handed its state. A screen past ~250 lines usually has logic settled into it. The one service calling `t()` is `channels.ts` (Android draws channel names in its own settings).
- TypeScript strict (`strictNullChecks`, `noImplicitAny`); functional components with hooks.
- Functions with 2+ parameters take a single object parameter (`fetchData({ id, signal })`).
- Atomic Zustand selectors only (`useStore((s) => s.field)`).
- **A memo keys on content, never on the identity of an array callers build**: key on `codes.join('|')`, with module-constant defaults (`const NO_CODES: readonly string[] = []`), never an inline `= []`.
- Env: `apps/mobile/.env` (see `.env.example`), `apps/api/.dev.vars` (see `.dev.vars.example`).
