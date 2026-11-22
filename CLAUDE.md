# CLAUDE.md

The rules whose breach is a real mistake, and where the detail lives; the code is the rest. A change that alters something documented here updates it in the same change, surgically, without being asked. Keep it in English.

Also: `README.md` (setup, release, website), `apps/mobile/ADS.md` (every ad placement; updated with any ad change), `docs/boilerplate-audit/ROADMAP.md` §4 (decisions already taken: read before re-opening one).

## Project

Template for a premium Expo app (placeholders `RN Starter` / `rn-starter` / `com.yourcompany.rnstarter`): `apps/mobile`, optional `apps/api` (Cloudflare Worker) with `packages/shared`, `apps/web` (static site).

**`scripts/setup.sh` sweeps the identity and must stay exhaustive**: anything new that hardcodes the name, slug, package id, site or support address joins it; a local module's Android package is `com.yourcompany.<name>`.

## Commands

Root: `pnpm dev | dev:mobile | dev:api | dev:web`, `build:web`, `android | ios`, `build`, `typecheck`, `lint`, `deploy:api`. In `apps/mobile`: `preb` / `preb:android` / `preb:ios`, `build:aab`, `build:install`, `licences` / `licences:android`, `analyze`.

`ios/` and `android/` are NOT committed (CNG, a decision): `pnpm --filter mobile preb` generates them.

## Build & release

- **Never hand-edit `android/`** (prebuild regenerates it): a config plugin in `apps/mobile/plugins/`.
- **Never `./gradlew clean`** (it wipes codegen under `node_modules/`): `pnpm --filter mobile preb:android --clean`.
- **Release signing is `withAndroidSigning`** (`keystore.properties`; else the debug keystore, which Play refuses).
- **A release build refuses `FORCE_FREE`/`FORCE_PRO` or a consent test aid** (`withReleaseEnvGuard`); no bypass: Pro in a release comes from a license tester's purchase.
- **`withCrashlyticsMapping` uploads only when `CI=true`** (a local build must not replace the live mapping).
- **Import an icon family by subpath** (`@expo/vector-icons/Ionicons`): `withAndroidFontFilter` strips fonts outside `KEEP_FONTS`.
- **A declared permission is a promise on the store listing**: a permission in `android.blockedPermissions` fails at runtime, never at build; the feature needing it unblocks it. `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` are never blocked.
- **A Play declaration is a form, not a design constraint**: never narrow a feature to avoid one; what binds is a plain disclosure before the system dialog.

### Continuous delivery

`.github/workflows/release-android.yml` releases a PR merged into `main` with the `release` label to Play's internal track. README, *Android release*, is its human half: update both.

- **`const version` and the `versionCode` formula in `app.config.js` stay in step** with `compute-android-version.sh`.
- **The PR title becomes the Play release name** (`<version> - <title>`, cut at 50 chars): lead with subject and action.
- If all 3 publish attempts fail, read the **first** before re-running (an attempt can land and still report failure).
- The version bump pushes with `GITHUB_TOKEN`: a `main` closed to direct pushes refuses it after the build reached Play.

## Navigation

- **A screen that covers the tabs is a stack route beside `(tabs)`, never a tab.**
- **What owns the screen without being a route handles the back key** (`BackHandler`); a route uses `useHardwareBack`.
- **A flow that ends resets the stack with `resetToHome()`** (`utils/navigation.ts`) or `<ExitToHome />`, never `router.replace('/')` or `<Redirect href="/" />`.
- **The onboarding moves by step name, never index**; a swipe does what the step's button does, never more (a purchase is never a swipe); neighbour steps mount ahead, so nothing visit-only runs on mount.
- **The onboarding ends on the entitlement, never a purchase call** (`purchasePlan()` resolves before React commits the tier).

## State and storage

- **MMKV is the only key-value store; no AsyncStorage** (it brings back the boot gate). `persist` wraps values in `{ state, version }`.
- **What a store's `merge` changes is written once after hydration** (`persist` writes on `setState` only): raise a module flag in `merge`, then in `onRehydrateStorage` clear it and `queueMicrotask(() => useStore.setState({}))` (the microtask is required).
- **What grants something lives in the encrypted instance only** (`secure.ts`, kept off backup by `withBackupRules`); its key never changes once released. **Never encrypt the main instance.**
- **The action counter is fed by `recordAction()` only**, never reset.
- **A last-used setting is remembered per feature, never by default**; one a tier gates is a preference, clamped on every read. **A free-tier limit applies on read, never on write.**

## Services and analytics

- **A screen view is the route's pattern (`useSegments()`), never its pathname** (a dynamic value would reach Analytics); a route whose name is sensitive takes a dynamic segment (`add/[kind]`).
- **Notifications**: the feature that needs the permission asks, where the user sees what it buys; whether to ask is the OS's answer, never an app flag (it rides backup). The scheduler never asks. A channel's sound is frozen at creation (new sound, new id). The foreground handler always asks for the sound (else no heads-up banner).
- **`patches/expo-notifications@0.32.17.patch` must survive every bump** (re-cut it). It declares `aps-environment`: the iOS App ID needs Push Notifications or signing fails.
- **expo-notifications' keep rule goes through `extraProguardRules`** (`app.config.js`): 0.32 never hands it to R8, which then breaks every scheduled notification in a release only. Drop it once the package registers it as a consumer file (57.0.3).
- **`promoCoordinator` decides every interruptive surface**: no stacking, one automatic interruption per session; a user-opened paywall spends none. A failure not the user's own mutes automatic promos for 10 min (`markFriction`).
- **Reminders are inexact**: Play grants `USE_EXACT_ALARM` only to alarm, timer and calendar apps.
- **In-app updates: nothing installs on its own** (only the user's *Restart* calls `completeUpdate`).

## Data fetching

- **Connectivity is `useNetworkStatus`'s one NetInfo subscription** (unknown = online); it never decides the entitlement.
- **Anything added only for the backend joins `scripts/remove-api.sh`'s list in the same change.**

## Monetization

- **AdMob ids are literals, never `.env`; a pending unit resolves to `null` and requests nothing**; never lend a placement another's unit; `__DEV__` uses `TestIds`.
- **Nothing requests an ad on a Firebase Test Lab device** (invalid traffic) **or before consent**: `consentService` is the only caller of `mobileAds().initialize()`, never for a subscriber.
- **A sensitive audience (health) gets non-personalized ads only**: `AD_NON_PERSONALIZED_ONLY`, an `apps/mobile/firebase.json` turning off Analytics ad-personalization and adid collection, and the privacy policy rewritten.
- **An action is counted, then offered to one promo, in fixed order**: `recordAction()` → contextual paywall → interstitial → rating ask; the first that takes it ends the chain. Don't flip it.
- **Only a closed interstitial resets the cadence**. A banner mounts once per visit.
- **`openPaywall` is the single choke point** (resolves `false` for a subscriber and before onboarding ends).
- **The offer is data, not code**: plans, prices and trials come from `offerings.current`; never hardcode a product id or a trial length. A trial is one only when `introPrice.price === 0`; an empty offer says so, never a disabled button.
- **Every buy button states its charge beside it** (`legalNote`). **No social proof the store can't back, no urgency it doesn't enforce** (a countdown over a fixed price).
- **A one-time purchase is offered when the subscription is turned down, never beside it** (unless `lifetimePlacement: 'inline'`).
- **The purchase's own answer is the answer**: no `ENTITLEMENT_PREMIUM` is `purchase_failed`. Failures are classified by code; only the unknown is a non-fatal.
- **Entitlement and prices are two independent calls**, never one `try` around `Promise.all`.
- **`PRO_BENEFITS` names only limits the free tier enforces.** Interpolate a limit as `limit`, never `count`.
- **`applyCustomerInfo` is the single place a CustomerInfo becomes the tier**; `unverifiedIsPremium()` only seeds it before the store answers or when it can't be reached; the grace period is Play's.

## App rating

- **Play forbids pre-filtering the review**: `requestNativeReview()` and Play's card are the whole ask.
- **One pure policy decides** (`evaluateReviewRequest`); ask where the app just delivered something, never inside a task.
- **`requestNativeReview()` for automatic flows only**; a tap calls `openStoreListing()`.
- **`softResetDays` must stay above `cooldownDays × backoffMultiplier^(requestCap − 1)`**, or the cap never binds.

## Brand and legal

- **Brand images come from `scripts/generate-brand-assets.py`**, never a hand-edited PNG.
- **`/privacy` and `/terms` are a contract with every installed build**: never renamed, translated or locale-prefixed; a domain move edits `constants/legal.ts` and `SITE.url` together.
- **Open-source notices are generated, never written** (`scripts/generate-licences.mjs`): never hand-edit `licences.generated.json` or drop its generation from a build. Vendored C/C++ sits in `third_party/<lib>/` with a `NOTICE.md` (`# Name`, `- Licence:`, `- URL:`).

## Layout and styling

- **One surface owns the bottom inset**: on a tab the tab bar (`useTabBarPadding()`); a stack route adds `insets.bottom` itself; sheets add none.
- **A large screen gets a centred column (`UI_CONFIG.MAX_CONTENT_WIDTH`), never a second one**; nothing in it is sized from the window width; never `Dimensions.get()` at module scope.
- **A rem is 15 dp** (`inlineRem: 15`); don't change it without a device check.
- **A style that can be a class is one** (else the size ignores the rem); px only for touch targets, borders and JS positions. **Never wrap an animated component in `cssInterop`.**
- **Read the colour scheme with `useThemedColor()`, never `settings.theme`** (it stores `'auto'`).
- **Brand colours are roles, never hues** (`constants/palette.js`). Text: 700+ in light, never 500; no text under 4.5:1.
- **Silent traps:** state variants (`active:`) go on the `Pressable` itself; a `Pressable` never takes a `style` function; a horizontal `ScrollView` in a column takes `flexGrow: 0`; a `BlurView` needs `experimentalBlurMethod="dimezisBlurView"`; a view sized from its content's measurement ignores a report within a pixel of its height; no `KeyboardAvoidingView` in a `Modal` (`ModalDialog` pads itself).
- **Metro doesn't tree-shake**: run `pnpm --filter mobile analyze` around a dependency change; `date-fns` per function.

## Accessibility

- **Every control states its role, name and state; nothing else is a stop.**
- **Nothing acts on a timer while a screen reader is on**; progress is announced each quarter, never per tick.
- **No font-scale cap, ever** (no `maxFontSizeMultiplier`, no `allowFontScaling={false}`): heights around text are minimums, labels wrap.

## Internationalization

- **Feature work provides EN and FR only**; the other 18 in dedicated sessions, at key parity with `en.json` and one value per plural category. A string interpolating `count` is a plural. `common.*` alone may hold an unread key.
- **RTL mirrors the layout, never a transform** (flip travel by `I18nManager.isRTL`).
- **One register per language, whole app.** Formal: fr `vous`, ru, tr, id, hi, bn, ar, zh `您`, ja, ko. Informal: es, de, it, nl, pl, pt-BR, sv, vi.
- No "successfully", no "Please" before a recovery action, no "Are you sure you want to…"; errors in the user's terms; EN labels sentence case; ellipsis `…`.
- **Dashes follow the language**: em/en dashes only where a language uses them as ordinary punctuation (Russian, Polish, Chinese; spaced en dash in German, Dutch, Swedish). Everywhere else, code, comments, docs and commits included: a period, comma, colon or parentheses, never a spaced hyphen.
- **A translation reads as if a native copywriter wrote it for that screen**: one agent per language, each key read where it is shown; meaning, keys and placeholders never change, nor any element of a sentence about money, permissions or store policy; every change comes back with a back-translation.

## API (`apps/api`)

**The server decides who is premium** (`middleware/premium.ts`): RevenueCat not answering is `503`, never "no"; without its secret and project id every caller is premium.

## Web (`apps/web`)

Static export (README, *Website*); an app may reshape it freely, keeping `/privacy` and `/terms`.

- **`apps/web/vercel.json` is the one copy of what the export can't carry; `lib/routes.ts` the only list of pages.**
- **Its `ignoreCommand` (`scripts/vercel-ignore-build.sh`) deploys only when `apps/web` or a root install input changed** (Vercel's skip and `turbo-ignore` count any root file): a file above `apps/web` the site starts reading joins its list.
- **Figures and features are constants, never typed into copy** (`lib/facts.ts`, `lib/features.ts`).
- **The site never names a competitor, quotes a price or shows a rating; no `aggregateRating` or `offers` in JSON-LD.**
- **The privacy policy describes what the app does** and changes in the same commit as a new SDK, permission or data sent. The site sets no cookie and loads nothing third-party.
- **The site pins the mobile app's exact React** (`node-linker=hoisted`): no Tailwind v4.

## Known gaps: do not "fix" blindly

- `react-native-worklets` is 0.6.1 where SDK 54 expects 0.5.1, on purpose (`expo.install.exclude`).
- Shipped with no caller yet: `AppRatingModal`, `useCappedByTier`, `useDebounce`, `OfflineBanner`, `exampleService`. Remote push isn't wired.
- The committed licences list says `pending` for Android libraries until a local `build:aab`; never fill it by hand.
- No data migration ships: an app changing storage on a released build owes its users one.

## Testing

**No tests.** Do not write, suggest or run tests, nor add test files or testing libraries.

## Code style

- **Zero comments by default**, bar what the code can't say: a crash history, a security boundary, a store or legal constraint, a platform trap that breaks silently once "simplified".
- **Three layers**: `services/` (no React, `router` or `t()`, bar `channels.ts`), `hooks/` (orchestration), `app/` + `components/` (assembly). A pure decision is handed its state (`reviewPolicy.ts`).
- Functions with 2+ parameters take one object; atomic Zustand selectors.
- **A memo keys on content, never on the identity of an array callers build** (no inline `= []` default).
