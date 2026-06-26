# All Currency Converter — Contexte Projet (mobile)

## Vue d'ensemble

Application mobile de conversion de devises construite avec Expo SDK 54 / React Native 0.81.5 / React 19. Supporte 170+ devises avec mode hors-ligne, monétisation AdMob, abonnement premium RevenueCat, sauvegarde Google Drive, export CSV/PDF, alertes de taux de change avec push notifications FCM, widget natif Android (Glance) et 20 langues.

- **Bundle ID** : `com.codeurdivoire.allcurencyconverter`
- **Version** : calculée dans `app.config.js` — `major*10000 + minor*100 + patch`
- **Monorepo** : `apps/mobile/` (cette app), `apps/api/` (Cloudflare Worker), `packages/shared/`

---

## Stack Technique

| Technologie | Version | Rôle |
|---|---|---|
| Expo | ~54.0.23 | Plateforme React Native |
| React | 19.1.0 | UI |
| React Native | 0.81.5 | Framework natif |
| Expo Router | ~6.0.14 | Navigation file-based |
| Zustand | ^5.0.8 | State management (avec `persist` middleware) |
| @tanstack/react-query | ^5.100.8 | Data fetching (taux historiques + alertes) |
| react-native-mmkv | ^3.3.3 | Storage local sync |
| @react-native-async-storage/async-storage | ^2.2.0 | Conservé pour migration one-shot uniquement |
| i18next + react-i18next | ^25.6.2 / ^16.3.3 | i18n (20 langues, lazy) |
| Axios | ^1.13.2 | HTTP |
| NativeWind | ^4.2.1 | Tailwind CSS pour RN |
| react-native-reanimated | ~4.1.1 | Animations |
| moti | ^0.30.0 | Animations déclaratives |
| react-native-reorderable-list | ^0.18.0 | Liste drag-to-reorder du convertisseur (`TargetCurrencyList`) — virtualisée, pull-to-refresh natif. Le widget utilise un système custom distinct (`ReorderablePairs`) |
| date-fns | ^4.1.0 | Dates |
| react-native-google-mobile-ads | ^15.5.0 | AdMob |
| react-native-purchases | ^10.0.1 | RevenueCat (IAP) |
| @react-native-google-signin/google-signin | ^16.1.2 | Google Sign-In (Drive backup) |
| @react-native-firebase/{app,analytics,crashlytics,messaging} | ^24.0.0 | Firebase (Analytics, Crashlytics, FCM) |
| expo-notifications | | Push notifications (expo-side FCM tap handler) |
| react-native-chart-kit | ^6.12.0 | Graphiques stats |
| @react-native-community/netinfo | ^11.4.1 | Détection réseau |
| react-native-restart | ^0.0.27 | Restart natif (RTL) |
| expo-print | ~15.0.8 | Export PDF |
| expo-sharing | ~14.0.8 | Partage de fichiers |
| expo-store-review | ^55.0.13 | Notation in-app |
| widget-watchlist | workspace:* | Module natif Expo (widget Android Glance) |

---

## Structure du projet

```
apps/mobile/
├── app/
│   ├── _layout.tsx               # Providers + tabs + onboarding gating
│   ├── index.tsx                 # Convertisseur (tab 1)
│   ├── statistics.tsx            # Statistiques + AlertsBell (tab 2)
│   └── settings.tsx              # Paramètres + AlertsSettingsSection (tab 3)
├── components/
│   ├── ads/                      # AdBanner, RewardedAdButton
│   ├── alerts/                   # AlertFormScreen, AlertListItem, AlertNotificationCard,
│   │                             #   AlertPairSelector, AlertPreviewLocked, AlertsBottomSheet,
│   │                             #   AlertsHub, AlertsOnboardingCard, AllAlertsBottomSheet,
│   │                             #   CreateAlertForm, HubScrollView, MiniRateChart, PairGroupBlock,
│   │                             #   PermissionView, SheetBackButton, TriggeredAlertItem
│   ├── calculator/               # CalculatorButton, CalculatorDisplay, CalculatorKeyboard
│   ├── charts/                   # ExchangeRateChart, StatisticsCard
│   ├── conversion/               # SourceCard, TargetCurrencyList, TargetCurrencyRow,
│   │                             #   TargetCurrencyResult, TargetCurrencyRowSkeleton,
│   │                             #   ConversionStatusBanners
│   ├── currency/                 # CurrencyItem, CurrencyPicker, CurrencyMultiPicker, CurrencySelector
│   ├── export/                   # ExportBottomSheet, ExportSplitButton, ExportButtonWithGate, ExportGateSheet
│   ├── layout/                   # BackupBootstrap, MigrationLoadingScreen, TelemetryEffects
│   ├── onboarding/
│   │   ├── OnboardingScreen.tsx
│   │   ├── components/           # OnboardingBackButton, OnboardingProgressBar
│   │   ├── steps/                # WelcomeStep, PersonaQuestionStep, CurrencyPickerStep,
│   │   │                         #   AhaMomentStep, PitchProStep, ExitIntentSheet
│   │   └── PersonaVisualMock/    # PhoneFrame (shared device shell), AlertNotificationMock,
│   │                             #   CleanAppMock, DocumentExportMock, PhoneHomeScreenMock
│   ├── paywall/                  # PaywallModal, PaywallPlanCard
│   ├── premium-gates/            # BackupSectionGate, index.ts
│   ├── settings/                 # AlertsSettingsSection, BackupSection, DisplaySection,
│   │                             #   LegalSupportSection, PremiumBanner, QuickCurrencyList,
│   │                             #   QuietHoursSheet, SettingsSection, SubscriptionGraceBanner
│   ├── statistics/               # AlertsBell, StatisticsCurrencyPairSelector, StatisticsPeriodSelector
│   ├── widget/                   # HowToAddSheet, PairPickerRow, PostPurchaseWidgetCard,
│   │                             #   WidgetPreviewCard, WidgetSettingsSheet, WidgetSparkline
│   └── ui/                       # AppRatingModal, GradientButton, InitialLoadErrorModal,
│                                 #   InitialLoadingScreen, LanguagePicker, LastUpdateBadge,
│                                 #   ModalBottomSheet, PremiumGate, PremiumTabBar,
│                                 #   PullToRefreshTutorial, RatingModal, RefreshButton,
│                                 #   RTLRestartBanner, ScreenContainer, ScreenHeading,
│                                 #   SettingsLinkRow, SlidingSelector, ThemedText, Toast
├── constants/
│   ├── admob.ts                  # IDs et feature flags AdMob
│   ├── Colors.ts                 # Thème clair/sombre
│   ├── config.ts                 # API, cache, UI, offline, RTL
│   ├── contextualPaywall.ts      # CONTEXTUAL_PAYWALL_CONFIG + ContextualTrigger
│   ├── currencies.ts             # 170+ devises
│   ├── languages.ts              # 20 langues (noms natifs)
│   ├── legal.ts                  # URLs légales, store URLs
│   ├── personaContent.ts         # Contenu par persona (traveler, trader, freelancer, general)
│   ├── purchases.ts              # RevenueCat (entitlement, products, SUBSCRIPTION_GRACE_PERIOD_MS)
│   └── rating.ts                 # Notation in-app (seuils, URLs)
├── contexts/
│   └── SubscriptionContext.ts    # SubscriptionContextValue + createContext
├── hooks/
│   ├── useAdFreeRemainingMinutes.ts
│   ├── useAlertActions.ts          # confirmDelete/confirmRecreate (dialogs + toasts) partagés
│   ├── useAlertHistoricalRates.ts  # TanStack Query 30j pour mini-graphe alerte
│   ├── useAlertsHubData.ts         # Dérive actives/déclenchées + regroupement par paire
│   ├── useAlertsOnboarding.ts      # Onboarding alertes (MMKV flag)
│   ├── useAppRating.ts
│   ├── useCalculator.ts
│   ├── useContextualPaywall.ts     # Déclenche le paywall contextuel
│   ├── useConversion.ts
│   ├── useConverterExport.ts
│   ├── useConverterRating.ts
│   ├── useConverterUIState.ts
│   ├── useCurrencyInitialization.ts
│   ├── useCurrencyRates.ts
│   ├── useDebounce.ts
│   ├── useFilteredCurrencies.ts
│   ├── useHistoricalRates.ts
│   ├── useMultiConversion.ts
│   ├── useNetworkStatus.ts
│   ├── usePremium.ts
│   ├── useRTL.ts
│   ├── useTabBarPadding.ts
│   ├── useThemedColor.ts
│   └── useWidgetPreviewData.ts     # Cross-rate + variation/sparkline pour l'aperçu widget (Pro)
├── i18n/
│   ├── service.ts
│   └── languages/                # 20 fichiers JSON
├── modules/
│   └── widget-watchlist/         # Module Expo natif (widget Android Glance)
│       ├── src/                  # TS bridge + types
│       ├── android/              # Kotlin (Glance UI, DataStore, OkHttp, WorkManager)
│       └── plugin/               # withWidgetWatchlist.js (config plugin)
├── providers/
│   ├── AdFreeProvider.tsx
│   ├── AlertNotificationProvider.tsx  # Banners foreground + deeplink alertes
│   ├── QueryProvider.tsx
│   ├── SubscriptionProvider.tsx       # RevenueCat + grace period + PostPurchaseWidgetCard
│   ├── ThemeProvider.tsx
│   └── ToastProvider.tsx
├── services/
│   ├── api/
│   │   ├── activeBackupProvider.ts
│   │   ├── adService.ts
│   │   ├── alertsService.ts           # CRUD alertes + enregistrement token FCM
│   │   ├── analyticsService.ts
│   │   ├── backendService.ts
│   │   ├── contextualPaywall/         # index.ts (service) + policy.ts (évaluation pure)
│   │   ├── crashlyticsService.ts
│   │   ├── engagementService.ts
│   │   ├── exportService.ts
│   │   ├── googleAuthService.ts
│   │   ├── googleDriveBackupProvider.ts
│   │   ├── googleDriveBackupService.ts
│   │   ├── historicalRatesService.ts
│   │   ├── purchaseService.ts
│   │   ├── ratingService.ts
│   │   └── rewardedAdService.ts
│   ├── notifications/                 # FCM setup, channels, payload parser, background handler
│   │   ├── backgroundHandler.ts       # enregistre setBackgroundMessageHandler — importé depuis index.js (entry)
│   │   ├── channels.ts                # ensureNotificationChannels, recreateRateAlertsChannel
│   │   ├── index.ts                   # Exports publics
│   │   ├── payload.ts                 # parseAlertPayload + types AlertNotificationData
│   │   └── setup.ts                   # notificationService (requestPermission, setup, getToken)
│   ├── promo/
│   │   └── promoCoordinator.ts        # Anti-empilement + budget 1 auto-promo/session (paywall + tooltip)
│   ├── storage/
│   │   ├── adapter.ts
│   │   ├── domains/
│   │   │   ├── adFree.ts
│   │   │   ├── alerts.ts              # Cache local des alertes
│   │   │   ├── backup.ts
│   │   │   ├── conversion.ts
│   │   │   ├── engagement.ts          # + contextualPaywall counters
│   │   │   ├── rates.ts
│   │   │   ├── rating.ts
│   │   │   ├── subscription.ts        # Expiry + lifetime flag (grace period offline)
│   │   │   ├── userSettings.ts        # readUserSettingsFromStorage (lecture hors Zustand)
│   │   │   └── widget.ts              # Post-purchase card, tooltip, last known state
│   │   ├── index.ts
│   │   ├── keys.ts
│   │   ├── migration.ts
│   │   └── mmkv.ts
│   └── widget/
│       ├── evaluateTooltipTrigger.ts  # Décide si le tooltip widget doit s'afficher
│       └── widgetService.ts           # syncToNative, syncFromStorage, refresh (30s debounce)
├── stores/
│   ├── alertsStore.ts                 # Alertes (persisté MMKV, optimistic updates)
│   ├── backupStore.ts
│   ├── backupTrigger.ts
│   ├── currencyStore.ts
│   ├── deepLinkStore.ts               # In-memory only — pending alert deep-link
│   ├── exportPreferencesStore.ts
│   ├── onboardingStore.ts             # + persona + attemptedSkipTrial
│   ├── quickConversionsStore.ts
│   ├── settingsStore.ts
│   ├── statisticsStore.ts
│   ├── widgetSheetStore.ts            # In-memory only — open/close de la WidgetSettingsSheet
│   └── widgetStore.ts                 # Pairs (3 fixes)/period widget (persisté, sync natif, reorderPairs, swapPair)
├── types/
│   ├── api.ts                         # RateAlert, ThresholdRateAlert, VariationRateAlert,
│   │                                  #   CreateAlertParams, AlertDirection, AlertTriggerType
│   ├── backup.ts
│   ├── currency.ts
│   ├── index.ts
│   ├── settings.ts
│   └── statistics.ts
├── utils/
│   ├── alertRecreate.ts            # Params CreateAlert à partir d'une alerte déclenchée
│   ├── apiErrors.ts
│   ├── chartLabels.ts
│   ├── conversion.ts
│   ├── crossRate.ts
│   ├── currency.ts
│   ├── date.ts
│   ├── downsample.ts
│   ├── evaluateExpression.ts
│   ├── formatters.ts
│   ├── haptics.ts
│   ├── i18n.ts
│   ├── index.ts
│   ├── linking.ts
│   ├── onboardingMockConvert.ts
│   ├── pricing.ts
│   ├── quietHours.ts
│   ├── retry.ts
│   ├── rtl.ts
│   ├── snapBottomSheet.ts
│   ├── time.ts
│   └── validators.ts
├── plugins/
│   ├── withAndroidFontFilter.js
│   └── withPlayCoreResolution.js
├── app.config.js
├── metro.config.js
├── tailwind.config.js
├── tsconfig.json                      # strict + path aliases
└── package.json
```

---

## Navigation (Expo Router)

### Arbre des providers (`app/_layout.tsx`)

```
SafeAreaProvider
  └── RootLayoutContent
        ├── TelemetryEffects          ← side-effect, hors arbre providers
        ├── BackupBootstrap           ← side-effect, hors arbre providers
        ├── GestureHandlerRootView
        │     └── QueryProvider
        │           └── ThemeProvider
        │                 └── ToastProvider
        │                       └── SubscriptionProvider
        │                             └── AdFreeProvider
        │                                   └── AlertNotificationProvider
        │                                         └── AppContent
        └── RTLRestartBanner          ← hors arbre providers
```

`RootLayoutContent` exécute `runStorageMigration()` en premier, force `persist.rehydrate()` si la migration vient d'écrire dans MMKV.

`ToastProvider` détient l'état du toast et expose `showToast`/`hideToast`. Comme un `Modal` natif s'affiche dans une fenêtre au-dessus de l'app, le toast monté à la racine passe derrière. Le provider gère donc une pile de « hosts » : `ToastProvider` rend le toast racine, et chaque `Modal` (tout `ModalBottomSheet`, le `PaywallModal`) monte un `ModalToastViewport active={visible}` — sous son `GestureHandlerRootView` pour que le swipe-to-dismiss fonctionne. Seul le host le plus haut (dernier enregistré) rend le toast, donc il se place toujours au-dessus de la surface frontale et ne se déclenche jamais en double.

`AppContent` gère :
- Init session + analytics (`engagementService.initSession`, `analyticsService.init`) après `isSubscriptionInitialized`
- `contextualPaywallService.resetSession()` au boot
- Gating : onboarding → loading → tabs
- Si `isPremium` : `fetchAlerts()`, `ensureNotificationChannels()`, setup FCM via `notificationService.setup()`

### Écrans (tabs)

| Fichier | Tab | Notes |
|---|---|---|
| `index.tsx` | Convertisseur | 1 source → N cibles |
| `statistics.tsx` | Statistiques | Graphe historique + `AlertsBell` |
| `settings.tsx` | Paramètres | `AlertsSettingsSection`, `SubscriptionGraceBanner` |

> La config widget se fait dans la `WidgetSettingsSheet` (`ModalBottomSheet` plein écran), voir section **Widget Android**.

### Onboarding (5 étapes)

```
welcome → persona → currency → aha → pitch
```

- **WelcomeStep** — intro + sélection langue
- **PersonaQuestionStep** — profil utilisateur (`traveler | trader | freelancer | general`), adapte le contenu d'`AhaMomentStep`
- **CurrencyPickerStep** — détecte la devise du device via `getDeviceCurrencies()`
- **AhaMomentStep** — valeur-clé mise en avant selon persona (visual mock adapté)
- **PitchProStep** — pitch premium avec `ExitIntentSheet` si l'utilisateur tente de passer
- Complétion : `markCompleted()` + `addQuickCurrency(selected)`

---

## Stores Zustand (11 stores)

Tous les stores persistés utilisent `persist` + MMKV via `mmkvStateStorage`. Les mutations user-data appellent `triggerBackupSync()`.

### currencyStore — non persisté Zustand
- **État** : `rates`, `isLoading`, `isRefreshing`, `isInitializing`, `error`, `initializationError`, `lastUpdate`
- **Cache** : 30s debounce + 30min background refresh. Écrit via `ratesStorage` domain.
- `isDataStale()` : true si > 7 jours sans mise à jour

### settingsStore
- **État** : `settings` (theme, decimals, thousandSeparator, language, notifications, defaultCurrencyFrom, defaultCurrencyTo), `rtlRestartNeeded`, `rtlRestartTrigger`
- `setLanguage` : change la langue, RTL si besoin, appelle `widgetService.syncFromStorage()`
- `updateSetting` : sur `defaultCurrencyFrom` ou `decimals`, déclenche aussi `widgetService.syncFromStorage()`
- `onRehydrateStorage` : recharge la langue + RTL au boot

### onboardingStore
- **État** : `isCompleted`, `currentSlide`, `hasSeenPullToRefreshTutorial`, `persona` (`'traveler' | 'trader' | 'freelancer' | 'general' | null`), `attemptedSkipTrial`
- `markAttemptedSkipTrial()` — déclenche l'`ExitIntentSheet` au prochain skip

### quickConversionsStore
- **État** : `quickCurrencies` (codes)
- **Default** : `['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'XOF', 'THB']`
- **Min** : 3 devises (`MIN_QUICK_CURRENCIES`)

### statisticsStore (filtres uniquement)
- **État** : `fromCurrency`, `toCurrency`, `period`, `isManualMode`
- Les données historiques viennent de `useHistoricalRates` (TanStack Query)
- `syncFromConversion` ignoré si `isManualMode`
- L'API renvoie 1 point/jour ; `ExchangeRateChart` plafonne le tracé à 120 points via `downsampleLTTB` (LTTB) pour que le coût de rendu reste borné quelle que soit la période. Stats et export utilisent toujours la série complète.

### exportPreferencesStore
- **État** : `preferences` (format par type), `lastUsed`
- **Types** : `'conversion' | 'historical' | 'allRates'` × **Formats** : `'csv' | 'pdf' | null`

### backupStore — non persisté Zustand
- **État** : `isSignedIn`, `userEmail`, `lastBackupAt`, `isSyncing`, `isRestoring`, `isSigningIn`, `hasPendingSync`, `hasPendingRestoreOffer`, `error`, `isLoaded`
- Payload backup : settings, quickCurrencies, lastConversion, ratingState, adFreeUntil, exportPreferences

### alertsStore (nouveau)
- **État** : `alerts: RateAlert[]`, `isLoading`, `error`
- Persisté MMKV (clé `KEYS.ALERTS`), seules les alertes sont persistées
- **Optimistic updates** : `createAlert` insère un temp id immédiatement, rollback si API échoue ; `deleteAlert` idem
- Récupère le `rcCustomerId` via `Purchases.getCustomerInfo()` à chaque opération

### widgetStore (nouveau)
- **État** : `pairs: [PairKey, PairKey, PairKey]` (toujours 3 paires définies par l'utilisateur), `period: WidgetPeriodDays`
- Persisté MMKV (clé `KEYS.WIDGET_STORE`)
- Mutations : `setPair`, `swapPair`, `reorderPairs`, `setPeriod` — chacune appelle `triggerBackupSync()` + `widgetService.syncFromStorage()`
- Paires par défaut : EUR/USD, USD/JPY, GBP/EUR

### deepLinkStore (nouveau)
- **Non persisté** (in-memory uniquement)
- **État** : `pendingAlert: PendingAlertDeepLink | null`
- `consumePendingAlert()` lit et efface en une opération atomique

### widgetSheetStore
- **Non persisté** (in-memory uniquement)
- **État** : `isOpen` + `open()` / `close()`
- Déclencheur global de la `WidgetSettingsSheet`, ouverte depuis `index.tsx` (CTA tooltip) et `settings.tsx`

---

## Services (`services/api/`)

### alertsService (nouveau)
- `fetchAlerts({ rcCustomerId })`, `createAlert({ rcCustomerId, params })`, `deleteAlert({ rcCustomerId, alertId })`, `registerToken({ rcCustomerId, token })`
- Auth : headers `x-api-key` + `x-rc-customer-id`
- Retry via `withRetry`

### contextualPaywall/ (nouveau)
- `contextualPaywallService.evaluate({ isPremium, isOnboardingCompleted, now })` → `{ show: boolean }`
- Règles dans `policy.ts` : cooldown exponentiel (`cooldownDays × backoffMultiplier^shownCount`), lifetime cap, min sessions/conversions, une seule fois par session
- `recordShown(now)` persiste dans `engagementStorage`
- `contextualSource(trigger)` mappe un `ContextualTrigger` vers une source analytics

### notificationService (nouveau)
- `requestPermission()` — demande la permission FCM + aligne expo-notifications
- `setup({ rcCustomerId, onForegroundAlert, onTapAlert })` — enregistre le token FCM (ne re-envoie que si token changé), souscrit aux messages foreground FCM et aux taps expo-notifications. Gère aussi le `lastResponse` au démarrage (cold-start depuis une notif).
- `getToken()` — lit depuis MMKV
- `backgroundHandler.ts` importé au tout début de l'entry JS (`index.js`, avant `expo-router/entry`) — garantit l'enregistrement de la headless task `ReactNativeFirebaseMessagingHeadlessTask` même en lancement headless (message data app balayée), ce que l'ancien import via `_layout` (route paresseuse) ne faisait pas

### widgetService (nouveau)
- `syncFromStorage()` — lit `subscriptionStorage.derive()`, `widgetStore`, `settingsStore`, appelle `WidgetWatchlist.syncState()` puis `refresh()`
- `syncToNative({ isPro, expiresAtMs, gracePeriodMs })` — idem avec paramètres explicites
- `refresh({ force? })` — appelle `WidgetWatchlist.requestRefresh()`, debounce 30s (sauf `force: true`)

### backendService
- `fetchRates(baseCurrency)` — taux courants depuis le Worker (`/rates/:base`)

### historicalRatesService
- `fetchHistoricalRates({ params, signal })` — abortable, retourne `{ rates, statistics }`

### purchaseService (RevenueCat)
- `initialize()`, `getCustomerInfo()`, `isPremiumActive({ customerInfo })`, `getOfferings()`, `purchasePackage({ pkg })`, `restorePurchases()`

### exportService
- Export CSV / PDF pour `conversion`, `historical`, `allRates` via `expo-print` + `expo-sharing`

---

## Storage (`services/storage/`)

### Domains

| Domain | Rôle |
|---|---|
| `adFree.ts` | Timestamp d'expiration session ad-free |
| `alerts.ts` | Cache local de la liste des alertes |
| `backup.ts` | `lastBackupAt`, `userEmail`, `lastOffered` |
| `conversion.ts` | Dernière conversion (amount + fromCurrencyCode) + total réussis |
| `engagement.ts` | Install date, session count, paywall counters (classique + contextuel) |
| `rates.ts` | Per-pair historical cache avec TTL eviction 24h + index |
| `rating.ts` | Compteurs prompts, `hasRated`, `declinedForever`, dates |
| `subscription.ts` | Expiry (ms) + flag `isLifetime` — **source de vérité offline** pour Pro gating |
| `userSettings.ts` | `readUserSettingsFromStorage()` — lecture directe hors Zustand (widget, notifications) |
| `widget.ts` | Post-purchase card shown, tooltip shown, last known added state |

### subscriptionStorage — logique clé
- `persistFromEntitlement({ isPremiumActive, expirationDateMillis, isOnline })` — ne vide le cache que si online et non-premium (RevenueCat offline peut mentir)
- `derive(nowMs, gracePeriodMs)` → `{ isPremium, isInGracePeriod, expiresAtMs }` — utilisé par `SubscriptionProvider` au démarrage (état instantané avant init RevenueCat) et par `widgetService.syncFromStorage()`

### Clés MMKV (`keys.ts`)

```
@migration_done
@ad_free_until
@subscription_expires_at, @subscription_is_lifetime
@first_app_usage, @install_date
@ad_execution_count, @ad_last_shown
@last_conversion, @total_successful_conversions
@offline_rates, @initial_data_loaded
@rating_*, @has_rated_app, @rating_declined_forever, @rating_last_prompt_date
@session_count, @paywall_shown_count
@contextual_paywall_last_at, @contextual_paywall_shown_count
@backup_last_sync, @backup_user_email, @backup_last_offered
@alerts, @alerts_onboarding_seen
@fcm_token, @fcm_token_registered_at, @notification_permission_requested
user_settings, quick_conversions, onboarding_seen
pull_to_refresh_tutorial_seen, statistics-filters
export_preferences, export_last_used, @export_downloads_uri
widget-store, widget-post-purchase-card-shown, widget-tooltip-shown, widget-last-known-added-state
rq-cache-v1   # TanStack Query persister
```

---

## Data Fetching (TanStack Query)

- `staleTime: 30min`, `gcTime: 24h`, `networkMode: offlineFirst`, `retry: 3`
- Persister MMKV (`rq-cache-v1`), buster = version app
- Seules les queries `['historicalRates', ...]` sont déhydratées
- `useHistoricalRates` : `keepPreviousData`, retourne un booléen de succès sur `refetch()`
- `useAlertHistoricalRates` : 30 jours, non persisté, pour le mini-graphe dans `CreateAlertForm`

---

## Premium et Paywall

### Constantes (`constants/purchases.ts`)
- `ENTITLEMENT_PREMIUM = 'Currency converter Pro'`
- `PRODUCT_IDS = { MONTHLY: 'premium:premium-monthly', ANNUAL: 'premium:premium-yearly' }`
- `TRIAL_DURATION_DAYS = 7`
- `SUBSCRIPTION_GRACE_PERIOD_MS` — grace period après expiration (offline safe)

### SubscriptionContextValue
```ts
{ isPremium, isInitialized, isLoadingPurchase, isInGracePeriod, isPaywallVisible,
  activeSubscription, monthlyPackage, annualPackage,
  purchaseMonthly, purchaseAnnual, restorePurchases, openPaywall, refreshSubscription }
```

### SubscriptionProvider
- Démarre avec `subscriptionStorage.derive()` pour un état instantané (avant init RevenueCat)
- Init RevenueCat → fetch parallèle `getCustomerInfo` + `getOfferings`
- `applyEntitlement` → `subscriptionStorage.persistFromEntitlement` (ne vide pas le cache si offline non-premium)
- `resolvePremiumFlags` : si online → RevenueCat fait foi ; si offline → `subscriptionStorage.derive()` + grace period
- Sync au foreground via `AppState`
- Après achat : `PostPurchaseWidgetCard` (widget Android) + `HowToAddSheet`
- `FORCE_FREE` env force `isPremium=false`
- `SubscriptionGraceBanner` dans settings si `isInGracePeriod`

### Premium gates
- **Ad-free** — banners + interstitials masqués
- **Backup Google Drive** — `BackupSectionGate`
- **Export CSV/PDF** — `ExportButtonWithGate` + `ExportGateSheet`
- **Alertes de taux** — `AlertsSettingsSection` (accès création, onboarding, liste)
- **Widget Android** — module natif se verrouille sans Pro

### Contextual Paywall
- `useContextualPaywall()` expose `maybeTrigger(trigger: ContextualTrigger): boolean`
- Évaluation via `contextualPaywallService.evaluate()` : cooldown exponentiel, lifetime cap, min sessions/conversions, une seule par session
- `session_return` **arme** seulement la session — ne déclenche jamais le paywall à froid au lancement ; le tir se fait au 1er moment de valeur (`power_action`, `after_n_conversions`, `rewarded_ad_dismissed`)
- Sources analytics mappées via `contextualSource(trigger)`

### Promo Coordinator (`services/promo/promoCoordinator.ts`)
- Autorité unique en mémoire sur les surfaces promo interruptives : paywall contextuel + tooltip widget Android
- `canPresentAutoPromo()` = aucune surface visible **et** budget « 1 auto-promo / session » libre ; `markAutoPromoShown()` le consomme ; `resetSession()` (appelé au boot par `contextualPaywallService.resetSession()`) le réarme
- `setPaywallVisible()` (depuis `SubscriptionProvider` `openPaywall`/`closePaywall`) et `setTooltipVisible()` (depuis `index.tsx`) → `isSurfaceVisible()` empêche tout empilement de modales
- Les ouvertures de paywall initiées par l'utilisateur enregistrent leur visibilité mais ne consomment pas le budget ; le tooltip one-shot n'est marqué `shown` que s'il s'affiche réellement (jamais « brûlé » derrière un paywall)

---

## Rate Alerts (Pro)

### Types (`types/api.ts`)
```ts
ThresholdRateAlert : { triggerType: 'threshold', direction: 'above'|'below', targetRate: number }
VariationRateAlert : { triggerType: 'variation', variationPercent: number, baselineRate: number }
RateAlert = ThresholdRateAlert | VariationRateAlert  // + id, rcCustomerId, isActive, triggeredAt?
```

### Flux mobile
1. Création depuis une paire fixe : `AlertsBell`/`AlertsSettingsSection` → `AlertsBottomSheet` (paire issue du contexte) → `CreateAlertForm`
1b. Création libre depuis le hub « Mes alertes » : `AllAlertsBottomSheet` → bouton « Créer une alerte » → `CreateAlertForm` en mode `editablePair` (paire source/cible modifiable via `AlertPairSelector` + `CurrencyPicker`, défauts = `defaultCurrencyFrom`/`defaultCurrencyTo`). Le gate de permission notifications est mutualisé via `notificationService.shouldShowPermissionPrimer()`.
2. `alertsStore.createAlert(params)` — optimistic insert temp id → `alertsService.createAlert()` → remplace par l'id serveur (ou rollback)
3. `alertsStore.fetchAlerts()` — au boot si premium, et après chaque notif reçue
4. FCM foreground : `notificationService.onForegroundAlert` → `AlertNotificationProvider.showAlertNotification()` (banner overlay)
5. Tap notif : `onTapAlert` → `deepLinkStore.setPendingAlert()` → navigation vers statistics avec la paire

### Flux API (cron)
- `handleCron` liste toutes les clés `alert:*` dans `ALERTS_KV` (paginated 100)
- Calcule le cross-rate via USD (rates USD cachés dans `RATE_CACHE`)
- Évalue `evaluateTrigger` (threshold ou variation)
- Si déclenché : `sendFCMNotification()` (JWT OAuth2, Firebase Messaging API v1)
- Si token mort (`UNREGISTERED`, `SENDER_ID_MISMATCH`) : supprime `user-fcm-token:*`
- Marque l'alerte `isActive: false` avec `triggeredAt` + `triggeredAtRate`

### Notifications
- `ensureNotificationChannels()` crée le channel `rate_alerts` (Android)
- `notificationService.setup()` appelé après init premium; ne re-enregistre le token FCM que si changé
- Les notifs FCM foreground sont **gérées en interne** (pas de notification système) — affichage via banner custom `AlertNotificationCard`
- Les taps (background/killed) passent par `expo-notifications` (`getLastNotificationResponseAsync` pour cold-start)
- **Patch natif** (`patches/expo-notifications@0.32.17.patch`) : `NotificationForwarderActivity.onCreate` est rendu fail-safe (try/catch → ouvre l'app au lieu de crasher) car sur certaines ROM OEM le système ne restaure pas les extras `Parcelable` du tap → `IllegalArgumentException: notification (null) and action (null)`. Nécessite un prebuild/rebuild natif (pas livrable en OTA).

---

## Widget Android (Pro)

Module Expo natif `modules/widget-watchlist/`. Config plugin fail si `widget.api.baseUrl` / `widget.api.key` manquants.

### Architecture Kotlin (`android/…/com/codeurdivoire/widget/`)
- `WidgetWatchlistModule.kt` — bridge Expo (`syncState`, `requestRefresh`, `isWidgetAdded`, `drainAnalytics`, …)
- `WatchlistGlanceWidget.kt` + `ui/` — Glance Compose (header, rows, états locked/empty/error, flip RTL)
- `WidgetDataStore.kt` — DataStore Preferences (pairs, strings, decimals, period, Pro state, expiry, offline, last success)
- `WidgetBackend.kt` — OkHttp (10s timeout), parallel `async/awaitAll` par base currency distincte
- `WidgetRefreshWorker.kt` — CoroutineWorker : retry 5xx/réseau, fail terminal 4xx/config/parse
- `WidgetRefreshScheduler.kt` — periodic 1h WorkManager + jitter 0–15min + oneshot on-demand
- `SparklineRenderer.kt` — 56×22 dp, couleurs `R.color.widget_{up,down,neutral}`, bitmap 1×1 transparent pour lignes vides
- `WidgetAnalyticsLog.kt` — file d'events drainée par JS via `drainAnalytics`, chaque event stamp `at` (epoch ms)

### Sync JS → natif
1. Mutation dans `widgetStore` / `settingsStore` → `widgetService.syncFromStorage()`
2. `syncFromStorage` : `subscriptionStorage.derive()` → `WidgetWatchlist.syncState(...)` → `widgetService.refresh()`
3. `refresh()` : debounce 30s → `WidgetWatchlist.requestRefresh()` → enqueue worker oneshot

### Config in-app (`WidgetSettingsSheet`)
- `ModalBottomSheet` plein écran (système de sheet natif de l'app : poignée/titre/overlay/physique de dismiss fournis), monté une fois dans `_layout` au-dessus des tabs, ouvert via `widgetSheetStore.open()` depuis `index.tsx` (CTA tooltip) et `settings.tsx`
- Le reorder est gated par un long-press (`ReorderablePairs`, liste Reanimated custom via `activateAfterLongPress`) : un flick rapide passe au pan de fermeture, et un shared value `dragLock` suspend ce pan pendant un drag actif → le drag-to-reorder ne rentre jamais en conflit avec le pull-to-close (corps entier). Le bouton retour Android est géré par le `Modal` sous-jacent
- `WidgetPreviewCard` affiche les **données réelles** : taux cross-rate (synchrone, `currencyStore`) + variation + `WidgetSparkline` (SVG), via `useWidgetPreviewData` (réutilise le cache TanStack Query `['historicalRates', …]` de l'écran statistiques ; fetch Pro-only et seulement quand la feuille est ouverte)
- Sélecteur de période (`SlidingSelector`) — libellés réutilisés des statistiques (`statistics.days{N}`)
- Les 3 paires sont toujours définies par l'utilisateur ; chaque `PairPickerRow` affiche les drapeaux, un bouton central d'inversion (`widgetStore.swapPair`) et reste réordonnable par drag au long-press (`ReorderablePairs` → `widgetStore.reorderPairs`), indépendantes des conversions rapides
- `HowToAddSheet` : instructions ajout widget écran d'accueil

---

## Hooks Custom

| Hook | Rôle |
|---|---|
| `useMultiConversion` | 1 source → N cibles (memo pur, sans debounce) |
| `useConversion` | 1→1, debounce 300ms |
| `useCurrencyInitialization` | Charge dernière conversion, expose `setAmount`, `updateFromCurrency`, `swapWithTarget`, sauvegarde debounced 500ms, sync statisticsStore |
| `useCalculator` | Machine d'état complète (`+ − × ÷ %`), max 50 chars |
| `useConverterRating` | Orchestre rating + interstitials après conversion |
| `useAppRating` | 7 gates, thresholds progressifs (7/5/10/20), max 4 prompts, soft reset 30j |
| `useFilteredCurrencies` | Filtre / tri / priorité / exclusions |
| `useCurrencyRates` | Auto-fetch + refresh |
| `useHistoricalRates` | TanStack Query historical, keepPreviousData |
| `useAlertHistoricalRates` | TanStack Query 30j pour mini-graphe création alerte (non persisté) |
| `useAlertsOnboarding` | Lit/écrit flag MMKV `@alerts_onboarding_seen` |
| `useAlertsHubData` | Dérive alertes actives/déclenchées + regroupement par paire (hub) |
| `useAlertActions` | `confirmDelete` / `confirmRecreate` (dialogs natifs + toasts), partagés entre les deux sheets |
| `useContextualPaywall` | `maybeTrigger(trigger)` → déclenche le paywall si conditions réunies |
| `usePremium` | `useContext(SubscriptionContext)` |
| `useNetworkStatus` | Détection réseau |
| `useRTL` | Helpers RTL |
| `useAdFreeRemainingMinutes` | Minutes restantes session ad-free |
| `useConverterExport` | Logique export depuis l'écran convertisseur |
| `useConverterUIState` | UI state local convertisseur |
| `useTabBarPadding` | Padding tab bar + banner optionnel |
| `useThemedColor` | Accès type-safe au thème |
| `useDebounce` | Debounce générique |
| `useWidgetPreviewData` | Taux cross-rate + variation/sparkline pour l'aperçu widget (`useQueries`, Pro-only) |

---

## Internationalisation

- **20 langues** : en, fr, es, de, pt-BR, zh-CN, zh-TW, ja, ko, ar, hi, bn, ru, id, tr, it, nl, sv, pl, vi
- Config `i18n/service.ts`. Lazy loading par langue (seuls `en` + langue device au boot).
- RTL (`ar`) : `I18nManager.forceRTL` + `RNRestart` + `RTLRestartBanner` optionnel

**Politique de traduction :**
- Toute mise à jour de clés i18n fournit les valeurs **EN et FR uniquement** — ces deux langues sont la source de vérité.
- Les 18 autres langues sont traitées dans des **sessions dédiées**, jamais en même temps que du travail feature.
- Les traductions ne sont **pas littérales** : elles sont adaptées au contexte de l'app (finance, taux de change) et à la façon naturelle de s'exprimer dans chaque langue.

---

## Workflows clés

### Boot
1. `runStorageMigration()` (AsyncStorage → MMKV, idempotent)
2. Si migration vient d'écrire : force `persist.rehydrate()` sur tous les stores
3. État premium instantané via `subscriptionStorage.derive()` (avant init RevenueCat)
4. `engagementService.initSession()` + `analyticsService.init()` après `isSubscriptionInitialized`
5. Si premium : `fetchAlerts()`, `ensureNotificationChannels()`, `notificationService.setup()`
6. Onboarding non complété → `OnboardingScreen` ; sinon `initializeOfflineData()` → tabs

### Alertes — cycle de vie
1. Création via `CreateAlertForm` → `alertsStore.createAlert()` (optimistic)
2. Cron API (toutes les heures) évalue les alertes actives contre les taux USD cachés
3. Si déclenchée : FCM envoyé, alerte marquée `isActive: false`
4. App foreground : banner `AlertNotificationCard` via `AlertNotificationProvider`
5. Tap notif (background/killed) : `deepLinkStore.setPendingAlert()` → navigation statistics

### Premium / Paywall
1. `SubscriptionProvider` démarre avec état depuis `subscriptionStorage.derive()` (instantané)
2. Init RevenueCat → état définitif
3. Offline + expiration → grace period via `subscriptionStorage`
4. `openPaywall({ source })` → `PaywallModal`
5. Après achat → `PostPurchaseWidgetCard` (si Android) + sync `widgetService`

---

## Stratégie cache et offline

| Donnée | Durée | Stockage |
|---|---|---|
| Taux courants | 30s debounce + 30min bg refresh | MMKV `@offline_rates` |
| Données historiques | 24h per-pair TTL | MMKV `rq-cache-v1` |
| Settings utilisateur | Permanent | MMKV `user_settings` |
| Alertes | Permanent (sync API au boot) | MMKV `@alerts` |
| État subscription | Permanent (mise à jour au foreground) | MMKV `@subscription_expires_at` |
| Taux offline | Permanent (préchargé) | MMKV `@offline_rates` |
| Backup Drive | À la demande / debounced | Google Drive AppData |

---

## Gestion d'erreurs

- `withRetry` : 3 tentatives, backoff exponentiel, 4xx (sauf 429) non-retryables
- `toApiError` / `isNonRetryableError` dans `utils/apiErrors.ts`
- Fallback : données cachées MMKV
- `InitialLoadErrorModal` au boot si init échoue sans cache
- Crashlytics : erreurs API, MMKV, widget, backup — toutes avec contexte
- FCM côté API : tokens morts supprimés automatiquement

---

## Path Aliases (`tsconfig.json`)

```
@/*           → racine
@components/* → ./components
@services/*   → ./services
@stores/*     → ./stores
@hooks/*      → ./hooks
@utils/*      → ./utils
@constants/*  → ./constants
@types/*      → ./types
@i18n/*       → ./i18n
@assets/*     → ./assets
```

⚠️ Pas d'alias `@providers/*` → utiliser `@/providers/*`. Pas d'alias `@contexts/*` → utiliser `@/contexts/*`.

---

## Commandes

Depuis la racine du monorepo :

```bash
pnpm dev:mobile      # Expo dev server
pnpm android         # expo run:android
pnpm ios             # expo run:ios
pnpm lint / format
```

Depuis `apps/mobile/` :

```bash
pnpm start
pnpm preb / preb:android / preb:ios
pnpm analyze         # source-map-explorer → report.html
```

---

## Conventions de code

- TypeScript strict (`strictNullChecks`, `noImplicitAny`)
- Functional components + hooks exclusivement
- **Object params** pour 2+ paramètres : `purchasePackage({ pkg })`, `fetchAlerts({ rcCustomerId })`
- **Atomic Zustand selectors** : `useStore((s) => s.field)`
- Mutations user-data persistées → `triggerBackupSync()` obligatoire
- Mutations widget-impactantes → `widgetService.syncFromStorage()` obligatoire
- Variables d'environnement dans `.env` (voir `.env.example`)
