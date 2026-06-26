# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Monorepo for a currency converter mobile app:

- **`apps/mobile`** — Expo SDK 54 / React Native 0.81.5 / React 19. 170+ currencies, offline mode, AdMob, RevenueCat premium, Google Drive backup, CSV/PDF export, rate alerts with push notifications, Android home-screen widget, 20 languages.
- **`apps/api`** — Cloudflare Worker (Hono): proxies ExchangeRate-API, serves rates + history, manages rate alerts (KV + FCM), runs a scheduled cron to evaluate and fire alerts.
- **`packages/shared`** — shared types and constants consumed by both apps.

Workspace tooling: pnpm workspaces + Turborepo. Bundle ID: `com.codeurdivoire.allcurencyconverter`.

## Living Documentation

`CLAUDE.md` (this file) and `apps/mobile/PROJECT_CONTEXT.md` must stay in sync with the code. Whenever a change alters something either file documents — navigation/routes, provider tree, stores, services, hooks, storage keys, premium gates, the widget system, i18n policy, conventions — **update both files as part of the same change, without being asked**. Keep the edits surgical: touch only the sections the change affects.  

## Commands

From the repo root:

```bash
pnpm dev              # Turbo dev (all workspaces)
pnpm dev:mobile       # Expo dev server only
pnpm dev:api          # Cloudflare Worker dev only
pnpm android          # expo run:android
pnpm ios              # expo run:ios
pnpm build            # Turbo build
pnpm lint             # Turbo lint
pnpm format           # Turbo format
pnpm test             # Turbo test (Vitest)
pnpm deploy:api       # wrangler deploy
```

From `apps/mobile`:

```bash
pnpm preb             # expo prebuild
pnpm preb:android     # expo prebuild --platform android
pnpm preb:ios         # expo prebuild --platform ios
pnpm analyze          # source-map-explorer bundle audit
```

## Architecture (mobile)

### Navigation

Expo Router file-based routing in `apps/mobile/app/`:
- `index` — converter (1 source → N targets)
- `statistics` — historical rates + rate alerts bell
- `settings` — preferences, backup, alerts settings section

Widget configuration lives in `WidgetSettingsSheet` (full-screen `ModalBottomSheet`, the app's native-Modal sheet system; closes on Android hardware back), mounted once in `_layout` above the tabs and opened via `widgetSheetStore.open()` from the converter (tooltip CTA) and settings entry points.

Onboarding flow gated in `AppContent` before tabs are shown. Custom `PremiumTabBar` with blur and haptics.

### Provider Tree

Composition in `app/_layout.tsx` (outer → inner):

```
SafeAreaProvider
  > RootLayoutContent          ← runs storage migration before anything
      TelemetryEffects         ← side-effect, outside provider tree
      BackupBootstrap          ← side-effect, outside provider tree
      GestureHandlerRootView
        > QueryProvider
          > ThemeProvider
            > ToastProvider
              > SubscriptionProvider
                > AdFreeProvider
                  > AlertNotificationProvider
                    > AppContent
      RTLRestartBanner         ← outside provider tree
```

`RootLayoutContent` runs `runStorageMigration()` (AsyncStorage → MMKV) then forces `persist.rehydrate()` on all Zustand stores if migration just ran.

### State Management

Zustand v5 stores in `apps/mobile/stores/`. All persisted stores use `persist` + MMKV via `mmkvStateStorage`:

- `currencyStore` — rates, init, offline cache (writes via `ratesStorage` domain, not Zustand persist)
- `settingsStore` — user preferences + RTL restart state
- `onboardingStore` — first-launch tracking
- `quickConversionsStore` — target currencies (drag-orderable, min 3)
- `statisticsStore` — filters only (from/to/period/isManualMode); data lives in TanStack Query
- `exportPreferencesStore` — per-type format preferences + last used
- `backupStore` — Google Drive session (not persisted; reads MMKV domains directly)
- `alertsStore` — rate alerts list (persisted, synced with API, Pro-only)
- `widgetStore` — widget pairs (always 3 user-defined) + period (persisted, mutations call `widgetService.syncFromStorage`); `reorderPairs` drives drag ordering, `swapPair` flips one pair's direction
- `widgetSheetStore` — in-memory only; open/close state for the widget settings sheet
- `deepLinkStore` — in-memory only; holds a pending alert deep-link until consumed

Mutations to user-owned stores call `triggerBackupSync()`. Mutations to `widgetStore` also call `widgetService.syncFromStorage()`.

### Storage

`apps/mobile/services/storage/`:
- `mmkv.ts` — single MMKV instance (`id: 'all-currency-converter'`)
- `adapter.ts` — sync `StateStorage` for Zustand persist
- `keys.ts` — all key constants (`KEYS`)
- `migration.ts` — one-shot AsyncStorage → MMKV (idempotent; AsyncStorage kept only for this)
- `domains/` — typed non-Zustand accessors: `adFree`, `alerts`, `backup`, `conversion`, `engagement`, `rates`, `rating`, `subscription`, `userSettings`, `widget`

Notable domains:
- `subscriptionStorage` — persists expiry + lifetime flag for offline Pro gating (used by widget and grace period banner)
- `alertsStorage` — local cache of the alerts list
- `widgetStorage` — widget UI state (tooltip, post-purchase card, last-known added state)

### API Layer

`apps/mobile/services/api/`:
- `backendService` — current rates (`/rates/:base`)
- `historicalRatesService` — historical rates (`/rates/:base/history`), abortable
- `alertsService` — rate alerts CRUD + FCM token registration (`/alerts`)
- `contextualPaywall/` — session-scoped paywall evaluation policy (decides when to show the paywall contextually)
- `purchaseService` — RevenueCat
- `googleAuthService`, `googleDriveBackupProvider`, `googleDriveBackupService`, `activeBackupProvider` — Drive AppData backup
- `exportService` — CSV/PDF via `expo-print` + `expo-sharing`
- `analyticsService` — Firebase Analytics typed wrapper
- `crashlyticsService` — Firebase Crashlytics
- `adService`, `rewardedAdService` — AdMob interstitial + rewarded (lazy-init)
- `ratingService` — `expo-store-review` + store URL fallback
- `engagementService` — session count, install date, paywall counter

`apps/mobile/services/widget/` — `widgetService` (sync from storage, refresh debounce), `evaluateTooltipTrigger`.

`apps/mobile/services/notifications/` — FCM setup (`notificationService`), channel management, payload parsing, background handler.

Network: Axios + `withRetry` (3 attempts, exponential backoff, 4xx non-retryable).

### Data Fetching

TanStack Query v5 for historical rates. `QueryProvider` uses `PersistQueryClientProvider` + MMKV persister. Only `historicalRates` keys are dehydrated. Cache buster = app version.

### Monetization

- **AdMob** — banners (per-screen), interstitial, rewarded. Lazy-init. Disabled when premium or ad-free session active.
- **RevenueCat** — entitlement `Currency converter Pro`, products `premium:premium-monthly` / `premium:premium-yearly`, 7-day trial. `openPaywall({ source })` from `SubscriptionProvider`. `FORCE_FREE` env for dev.
- **Contextual paywall** — `contextualPaywallService` evaluates session/conversion count to trigger the paywall at a value moment (`power_action`, `after_n_conversions`, `rewarded_ad_dismissed`). `session_return` only arms the session — it never cold-fires the paywall on launch.
- **Promo coordinator** — `services/promo/promoCoordinator.ts` is the single in-memory authority over interruptive promotional surfaces (contextual paywall + Android widget tooltip). It enforces no stacking (`isSurfaceVisible`) and one automatic promo per session (`canPresentAutoPromo` / `markAutoPromoShown`), reset at boot via `contextualPaywallService.resetSession()`. User-initiated paywall opens register their visibility but do not consume the auto-promo budget. The contextual paywall and the widget tooltip both claim through it, so they never collide and the one-time tooltip is never "burned" behind a paywall.
- **Premium gates**: no ads, Google Drive backup, CSV/PDF export, rate alerts, Android widget.
- **Subscription grace period** — `subscriptionStorage.derive(now, gracePeriodMs)` grants continued access after expiry. `SubscriptionGraceBanner` warns user.

### Rate Alerts (Pro)

Push-based alerts on exchange rate conditions (threshold above/below, % variation). Architecture:
- **Mobile**: `alertsStore` ↔ `alertsService` ↔ API. `AlertNotificationProvider` handles foreground banners and deep-link navigation via `deepLinkStore`. `notificationService` registers FCM token + handles background/tap events. Creation happens either from a fixed pair (`AlertsBottomSheet`, opened from the statistics bell) or freely from the "My alerts" hub (`AllAlertsBottomSheet`): the latter renders `CreateAlertForm` with `editablePair`, swapping the fixed pair for an `AlertPairSelector` + `CurrencyPicker`. The notification-permission primer is shared via `notificationService.shouldShowPermissionPrimer()`.
- **API**: `/alerts` routes (CRUD + FCM token), `ALERTS_KV` for storage. Cron handler (`handlers/cron.ts`) fetches current rates, evaluates all active alerts, sends FCM via `fcmService`, deactivates triggered ones.
- Alerts fetched at boot when `isPremium && isOnboardingCompleted`.

### Widget System (Android, Pro)

Native Glance widget as an Expo module under `apps/mobile/modules/widget-watchlist/`. Config plugin (`plugin/withWidgetWatchlist.js`) fails prebuild if `widget.api.baseUrl` / `widget.api.key` are missing.

Key Kotlin files in `android/src/main/java/com/codeurdivoire/widget/`:
- `WidgetWatchlistModule.kt` — Expo bridge (`updateWatchlist`, `setProState`, `setSubscriptionExpiry`, `requestRefresh`, `drainAnalytics`, …)
- `WatchlistGlanceWidget.kt` + `ui/` — Glance Compose UI
- `WidgetDataStore.kt` — DataStore Preferences
- `WidgetBackend.kt` — OkHttp, parallel fetches per distinct base currency
- `WidgetRefreshWorker.kt` — CoroutineWorker, retries on 5xx/network, fails terminally on 4xx/config
- `WidgetRefreshScheduler.kt` — 1h periodic WorkManager + 0–15 min jitter + on-demand oneshot
- `SparklineRenderer.kt` — 56×22 dp sparkline, colors from `R.color.widget_{up,down,neutral}`
- `WidgetAnalyticsLog.kt` — bounded event queue drained by JS via `drainAnalytics`

Widget is self-locking: Kotlin module receives Pro state + expiry so it can lock without the app open.

**In-app config** (`components/widget/WidgetSettingsSheet.tsx`): full-screen `ModalBottomSheet` (the app's native-Modal sheet system) so the whole body pulls to close; reorder is gated behind a long-press (`ReorderablePairs`, a custom Reanimated list using `activateAfterLongPress`) so quick flicks fall through to the close-pan, and a `dragLock` shared value suspends the close-pan during an active reorder — so drag-to-reorder never fights pull-to-close. Android hardware back is handled by the underlying `Modal`. `WidgetPreviewCard` renders **live data** — cross-rate (synchronous) + variation + `WidgetSparkline` (SVG) via `useWidgetPreviewData`, which reuses the statistics screen's TanStack Query cache (`['historicalRates', …]`) and only fetches when Pro and the sheet is open. The 3 pairs are always user-defined; each `PairPickerRow` shows currency flags, a tap-to-swap middle button (`widgetStore.swapPair`), and is reorderable via long-press drag (`ReorderablePairs` → `widgetStore.reorderPairs`), fully decoupled from the converter's quick conversions. Period labels reuse the statistics keys (`statistics.days{N}`).

### Styling

NativeWind v4, dark mode `'class'`. `GradientButton` for all primary CTAs. Animations: Reanimated 4 + Moti.

Toasts go through `ToastProvider` (`showToast`/`hideToast`). Native modals sit above the app window, so to surface a toast over one, mount `ModalToastViewport active={visible}` inside the modal's `GestureHandlerRootView` (already done in `ModalBottomSheet` and `PaywallModal`). A host stack ensures only the frontmost viewport renders the toast — never doubled.

### Internationalization

20 languages: en, fr, es, de, pt-BR, zh-CN, zh-TW, ja, ko, ar, hi, bn, ru, id, tr, it, nl, sv, pl, vi. Config `i18n/service.ts`, translations in `i18n/languages/`. Lazy-loaded per language. RTL (`ar`) triggers `I18nManager.forceRTL` + `RNRestart`.

**Translation policy:**
- All code changes that touch i18n keys must provide values in **EN and FR only**. These two are the source of truth.
- Translations into the 18 other languages are done in **dedicated sessions**, not alongside feature work. Never mix feature dev and mass translation in the same session.
- Translations must **not be literal**. They must be contextually adapted to the app's domain (finance, exchange rates, currencies) and to each language's natural phrasing. A translation that is grammatically correct but sounds mechanical is wrong.

### Path Aliases

Defined in `apps/mobile/tsconfig.json`: `@/*`, `@components/*`, `@services/*`, `@stores/*`, `@hooks/*`, `@utils/*`, `@constants/*`, `@types/*`, `@i18n/*`, `@assets/*`.

No `@providers/*` alias — import as `@/providers/*`. No `@contexts/*` alias — import as `@/contexts/*`.

## Architecture (api)

Hono app at `apps/api/src/index.ts`. Routes:
- `GET /` — health check
- `GET /rates/:base` — current rates (KV `RATE_CACHE`, TTL 3600s, stale-on-failure)
- `GET /rates/:base/history?target=&days=` — historical rates (point-level KV cache)
- `POST /alerts/token` — register FCM token for a RevenueCat customer
- `GET /alerts` — list alerts for a customer
- `POST /alerts` — create alert (threshold or variation, limit per user)
- `DELETE /alerts/:id` — delete alert

Middleware on `/rates/*` and `/alerts/*`: `rateLimiter` (30 req/IP/60s) then `apiKeyAuth` (`x-api-key` header). `/alerts/*` also requires `x-rc-customer-id` header (RevenueCat app user ID).

Scheduled: `handlers/cron.ts` — evaluates all active alerts against current rates, sends FCM via `fcmService`, deactivates triggered alerts.

## Testing

**No tests.** Do not write, suggest, or run tests. Do not add test files or testing libraries.

## Code Style

- Self-documenting code; comments only when logic is non-obvious. No what-comments, no task-trace comments.
- TypeScript strict (`strictNullChecks`, `noImplicitAny`).
- Functional components with hooks.
- **Functions with 2+ parameters use a single object parameter** — `fetchRates({ base, signal })`, not `fetchRates(base, signal)`.
- **Atomic Zustand selectors** — `useStore((s) => s.field)`, never object selectors.
- Environment variables: `apps/mobile/.env` (see `.env.example`), `apps/api/.dev.vars` / Cloudflare secrets.
