# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Monorepo boilerplate for a premium React Native / Expo app:

- **`apps/mobile`** — Expo SDK 54 / React Native 0.81.5 / React 19. AdMob (banner / interstitial / rewarded), RevenueCat premium subscription, contextual paywall (generic action-counter driven), Firebase Analytics + Crashlytics, push notifications (FCM + local scheduled reminders), app-store rating prompt, 20 languages, light/dark theme + RTL, onboarding flow (welcome → premium).
- **`apps/api`** — Cloudflare Worker (Hono): generic `/health` endpoint + one auth-protected `/example` route, API-key auth middleware, rate limiter, FCM push service.
- **`packages/shared`** — shared TypeScript types (`HealthResponse`, `ApiErrorResponse`).

Workspace tooling: pnpm workspaces + Turborepo. App identity placeholders: name `RN Starter`, slug `rn-starter`, bundle ID `com.yourcompany.rnstarter`, scheme `rnstarter`.

## Living Documentation

`CLAUDE.md` (this file) and `apps/mobile/PROJECT_CONTEXT.md` must stay in sync with the code. Whenever a change alters something either file documents — navigation/routes, provider tree, stores, services, hooks, storage keys, premium gates, i18n policy, conventions — **update both files as part of the same change, without being asked**. Keep edits surgical: touch only the sections the change affects.

## Commands

From the repo root:

```bash
pnpm dev              # Turbo dev (all workspaces)
pnpm dev:mobile       # Expo dev server only
pnpm dev:api          # Cloudflare Worker dev only
pnpm android          # expo run:android
pnpm ios              # expo run:ios
pnpm build            # Turbo build
pnpm typecheck        # TypeScript check (all workspaces)
pnpm lint             # ESLint (all workspaces)
pnpm deploy:api       # wrangler deploy
```

From `apps/mobile`:

```bash
pnpm preb             # expo prebuild (generates ios/ and android/)
pnpm preb:android     # expo prebuild --platform android
pnpm preb:ios         # expo prebuild --platform ios
```

Native `ios/` and `android/` are NOT committed (Continuous Native Generation). Run `pnpm --filter mobile preb` to generate them locally before running on a device.

## Architecture (mobile)

### Navigation

Expo Router file-based routing in `apps/mobile/app/`:
- `index` — Home screen (premium feature showcase + paywall CTA)
- `settings` — Settings screen (theme, language, premium, ads, notifications, legal)

Onboarding flow (2 steps: welcome → premium value) is gated in `AppContent` before tabs are shown. The welcome step exposes a top-left language selector that opens the shared `LanguagePicker` bottom sheet. Custom `PremiumTabBar` with blur and haptics.

### Provider Tree

Composition in `app/_layout.tsx` (outer → inner):

```
SafeAreaProvider
  > RootLayoutContent
      TelemetryEffects         <- side-effect, outside provider tree
      GestureHandlerRootView
        > QueryProvider
          > ThemeProvider
            > ToastProvider
              > SubscriptionProvider
                > AdFreeProvider
                  > AlertNotificationProvider
                    > AppContent
      RTLRestartBanner         <- outside provider tree
```

Persisted Zustand stores use MMKV via `mmkvStateStorage`, a synchronous `StateStorage`, so they hydrate synchronously at module import — no async gate or forced rehydration is needed at boot.

### State Management

Zustand v5 stores in `apps/mobile/stores/`. All persisted stores use `persist` + MMKV via `mmkvStateStorage`:

- `settingsStore` — user preferences (theme, language) + RTL restart state
- `onboardingStore` — first-launch tracking, persona, onboarding step
- `alertsStore` — scheduled local notification alerts (persisted, local-only)
- `deepLinkStore` — in-memory only; holds a pending alert deep-link until consumed

### Storage

`apps/mobile/services/storage/`:
- `mmkv.ts` — single MMKV instance
- `adapter.ts` — sync `StateStorage` for Zustand persist
- `keys.ts` — all key constants (`KEYS`)
- `domains/` — typed non-Zustand accessors: `adFree`, `ads`, `engagement`, `rating`, `subscription`, `userSettings`

Notable domains:
- `engagementStorage` — session count, install date, paywall counter, **generic action counter** (`getActionCount()` / `incrementAction()` / `resetActionCount()`). Call `incrementAction()` on any meaningful user interaction in your app to feed the contextual paywall.
- `subscriptionStorage` — persists expiry + lifetime flag for offline Pro gating and grace period banner
- `adFree` — tracks the ad-free window granted after a rewarded ad

### API Layer

`apps/mobile/services/api/`:
- `adService` — AdMob interstitial (lazy-init)
- `rewardedAdService` — AdMob rewarded (lazy-init)
- `analyticsService` — Firebase Analytics typed wrapper
- `crashlyticsService` — Firebase Crashlytics
- `engagementService` — session init, paywall counter
- `purchaseService` — RevenueCat
- `ratingService` — `expo-store-review` + store URL fallback
- `contextualPaywall/` — session-scoped paywall evaluation policy

`apps/mobile/services/notifications/` — FCM setup (`notificationService`), channels, payload parsing, background handler, `scheduleAlertNotification` (local scheduled reminders via `expo-notifications` DATE trigger).

`apps/mobile/services/promo/promoCoordinator.ts` — single in-memory authority over interruptive promotional surfaces (contextual paywall). Enforces no stacking (`isSurfaceVisible`) and one automatic promo per session (`canPresentAutoPromo` / `markAutoPromoShown`), reset at boot via `contextualPaywallService.resetSession()`.

### Monetization

- **AdMob** — banners (per-screen), interstitial, rewarded. Lazy-init. Disabled when premium or ad-free session active.
- **RevenueCat** — `REVENUECAT_ENTITLEMENT_ID` controls the premium gate. `openPaywall({ source })` from `SubscriptionProvider`. `FORCE_FREE` env var for dev.
- **Contextual paywall** — `contextualPaywallService` evaluates session count and generic action count (`engagementStorage.getActionCount()`) to trigger the paywall at a value moment. `power_action` / `after_n_actions` / `rewarded_ad_dismissed` triggers. `session_return` only arms the session — it never cold-fires the paywall on launch.
- **Subscription grace period** — `subscriptionStorage.derive(now, gracePeriodMs)` grants continued access after expiry. `SubscriptionGraceBanner` warns user.

### Styling

NativeWind v4, dark mode `'class'`. `GradientButton` for primary CTAs. Animations: Reanimated 4 + Moti.

Toasts go through `ToastProvider` (`showToast` / `hideToast`). Native modals sit above the app window, so to surface a toast over one, mount `ModalToastViewport active={visible}` inside the modal.

### Internationalization

20 languages: en, fr, es, de, pt-BR, zh-CN, zh-TW, ja, ko, ar, hi, bn, ru, id, tr, it, nl, sv, pl, vi. Config `i18n/service.ts`, translations in `i18n/languages/`. Lazy-loaded per language. RTL (`ar`) triggers `I18nManager.forceRTL` + restart.

**Translation policy:**
- All code changes that touch i18n keys must provide values in **EN and FR only**. These two are the source of truth.
- Translations into the 18 other languages are done in **dedicated sessions**, not alongside feature work. Never mix feature dev and mass translation in the same session.
- Translations must be contextually adapted — not literal. A translation that is grammatically correct but sounds mechanical is wrong.

### Path Aliases

Defined in `apps/mobile/tsconfig.json`: `@/*`, `@components/*`, `@services/*`, `@stores/*`, `@hooks/*`, `@utils/*`, `@constants/*`, `@types/*`, `@i18n/*`, `@assets/*`.

No `@providers/*` alias — import as `@/providers/*`. No `@contexts/*` alias — import as `@/contexts/*`.

## Architecture (api)

Hono app at `apps/api/src/index.ts`. Routes:
- `GET /health` — health check (unauthenticated)
- `GET /example` — example auth-protected route

Middleware on `/example/*`: `rateLimiter` (30 req/IP/60s) then `apiKeyAuth` (`x-api-key` header).

`Env` type in `apps/api/src/types.ts`: `API_KEY`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID`, `API_RATE_LIMITER` (Cloudflare binding).

## Testing

**No tests.** Do not write, suggest, or run tests. Do not add test files or testing libraries.

## Code Style

- Self-documenting code; comments only when logic is non-obvious. No what-comments, no task-trace comments.
- TypeScript strict (`strictNullChecks`, `noImplicitAny`).
- Functional components with hooks.
- **Functions with 2+ parameters use a single object parameter** — `fetchData({ id, signal })`, not `fetchData(id, signal)`.
- **Atomic Zustand selectors** — `useStore((s) => s.field)`, never object selectors.
- Environment variables: `apps/mobile/.env` (see `.env.example`), `apps/api/.dev.vars` (see `.dev.vars.example`).
