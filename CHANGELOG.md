# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Statistiques — TanStack Query [2026-05-08]

- 🚀 Réécriture complète de la couche fetch des taux historiques sur **TanStack Query v5**
  - Nouveau hook `useHistoricalRates` qui pilote l'écran statistiques
  - `historicalRatesService` pur avec support `AbortSignal`
  - Persistance MMKV via `PersistQueryClientProvider` + `createAsyncStoragePersister` (clé `rq-cache-v1`, buster = version app)
  - `staleTime` 30 min, `gcTime` 24 h, `keepPreviousData` pour transitions fluides
  - `statisticsStore` réduit aux **filtres uniquement** (from/to/period/isManualMode), data en cache Query
  - Provider `QueryProvider` avec `crashlyticsService.recordError` sur écritures MMKV échouées
- ✅ `refetch` retourne un booléen pour éviter le double toast d'erreur
- ✅ Couche legacy MMKV historical supprimée (méthodes mortes, import inutilisé)

### Render discipline & boot perf [2026-05-05]

- ⚡ Sélecteurs Zustand atomiques sur tout l'app (settings, theme, layout, hooks de taux, statistics)
- ⚡ `RewardedAd` et `InterstitialAd` lazy-initialisés (pas de pré-chargement au boot)
- ⚡ `AdFreeProvider` : remplacement du tick 60s par un timeout précis sur l'expiration
- ♻️ `RootLayoutContent` allégé — extraction de `BackupBootstrap`, `MigrationLoadingScreen`, `TelemetryEffects` dans `components/layout/`
- ♻️ `useConverterRating` stabilisé via `refs` (deps d'effet stables)
- ♻️ `ScrollView` imbriqué remplacé par `DraggableFlatList` comme scroller principal du convertisseur
- ⚡ Boot init : `engagementService.initSession` et `analyticsService.init` lancés en parallèle

### Storage — MMKV migration [2026-05-02]

- 🚀 **Migration AsyncStorage → MMKV** pour des reads/writes ~30× plus rapides (API synchrone)
  - `react-native-mmkv` v3 (class API), instance unique `id: 'all-currency-converter'`
  - Adapter sync `mmkvStateStorage` pour `zustand/middleware/persist`
  - Clés centralisées dans `services/storage/keys.ts` (`KEYS`)
  - Migration one-shot idempotente (`runStorageMigration`) avec transformation enveloppe Zustand `{state, version}`
  - Domaines typés : `adFree`, `backup`, `conversion`, `engagement`, `rates` (per-pair TTL eviction), `rating`
  - Cache historique restructuré en **clés par paire** avec éviction TTL 24 h et index
- 🧪 Vitest configuré pour les tests pure-JS (`storage`, `services`, `hooks`, `stores`, `utils`)
- 🔄 Adoption de Zustand `persist` middleware pour `settings`, `quickConversions`, `onboarding`, `exportPreferences`, `statistics`
- 🗑️ Suppression du wrapper AsyncStorage legacy (`services/api/storage.ts`)
- ⚠️ AsyncStorage conservé uniquement pour la migration ; sera retiré une fois l'adoption confirmée par la télémétrie
- 🐛 Erreurs d'écriture MMKV propagées pour log Crashlytics (au lieu d'être avalées)

### Premium subscriptions & paywall [2026-04-15]

- 💳 **Intégration RevenueCat** (`react-native-purchases`)
  - Service `purchaseService` (initialize, getCustomerInfo, getOfferings, purchase, restore)
  - `SubscriptionContext` + `SubscriptionProvider` exposant `isPremium`, `activeSubscription`, `openPaywall({ source })`
  - Entitlement `Currency converter Pro`, plans mensuel et annuel, essai 7 jours
  - Variable `FORCE_FREE` pour forcer le mode gratuit en dev
  - Sync au foreground via `AppState`
- 🎨 **Paywall**
  - `PaywallModal` + `PaywallPlanCard` avec hero illustrations clair/sombre
  - Features listées via `PREMIUM_FEATURES` (no ads, backup, export)
  - CTA via `GradientButton` partagé
- 🔒 **Premium gates** : ad-free permanent, sauvegarde, export
- 📊 Analytics : `subscription_synced`, `paywall_*`, contexte `isPremium`

### Sauvegarde Google Drive [2026-04-10]

- ☁️ **Backup Google Drive AppData** (Android)
  - `googleAuthService` (Google Sign-In + token OAuth)
  - `googleDriveBackupService` / `googleDriveBackupProvider` avec `BackupProvider` interface
  - `activeBackupProvider` (Android → Google Drive, iCloud à venir)
  - Store `backupStore` : sign-in, sync, restore, debounced trigger via `triggerBackupSync()`
  - Payload : settings, quickCurrencies, lastConversion, ratingState, adFreeUntil, exportPreferences
  - `BackupBootstrap` composant côté layout pour init silencieux

### Export CSV / PDF [2026-04-08]

- 📄 **Export** via `expo-print` + `expo-sharing` + `expo-file-system`
  - `exportService` : conversion courante, données historiques, tous les taux
  - `exportPreferencesStore` : préférences format par type (`conversion`, `historical`, `allRates`)
  - Composants : `ExportBottomSheet`, `ExportSplitButton`, `ExportButtonWithGate`, `ExportGateSheet`
  - Hook `useConverterExport`

### Backend Cloudflare Worker [2026-04-01]

- 🔐 **Rate limiter** appliqué avant `apiKeyAuth` sur `/rates/*` (30 req/IP/60s via KV `RATE_CACHE`)
- 🚀 Cache **point-level incrémental** pour taux historiques (KV)
- ⚡ Parallélisation des écritures KV dans `assembleHistoricalRates`
- 🔧 `RECENT_POINT_TTL_S` augmenté à 60 min pour réduire la consommation du quota ExchangeRate-API
- 🔄 ETag / Cache-Control retirés de `/history` (logique inutilisée)
- 🐛 Endpoint racine retourne `{ status: "ok" }` (health check)
- 🐛 TTL minimum garanti pour les entrées du cache rate limiter

### Corrections et nettoyage [2026-04-23]

#### Fixed
- 🐛 **Fallback iOS dans `ratingService`** — l'URL de fallback est choisie selon la plateforme : `STORE_URLS.IOS` (env `STORE_URL_IOS`) sur iOS, `PLAY_STORE_RATE_URL` sur Android
- 🐛 **`isManualMode` irréversible** — bouton "Sync auto" dans `statistics.tsx` (visible uniquement quand `isManualMode === true`)

#### Removed
- 🗑️ **Code mort** :
  - `apps/mobile/services/api/exchangeRateService.ts` — service legacy ExchangeRate-API (remplacé par `backendService`)
  - `apps/mobile/components/conversion/AmountInput.tsx` — composant non utilisé
  - `IAP_CONFIG` dans `constants/config.ts` — config IAP non intégrée (remplacée par `constants/purchases.ts`)
  - `STORAGE_KEYS.FAVORITES` et `STORAGE_KEYS.HISTORY` dans `CACHE_CONFIG`

### Monorepo & shared package [2026-03-15]

- 🏗️ Restructuration en **monorepo Turborepo + pnpm workspaces**
  - `apps/mobile` (app React Native)
  - `apps/api` (Cloudflare Worker, Hono)
  - `packages/shared` (types et constantes communs, build via tsup)
- 🔧 Scripts racine : `pnpm dev`, `pnpm dev:mobile`, `pnpm dev:api`, `pnpm test`, `pnpm deploy:api`

### Corrections et nettoyage [2026-04-23]

#### Fixed
- 🐛 **Rate limiter backend non appliqué** — `rateLimiter` importé et appliqué avant `apiKeyAuth` sur `/rates/*` dans `apps/api/src/index.ts` (30 req/IP/60s via KV `RATE_CACHE`)
- 🐛 **Fallback iOS dans `ratingService`** — L'URL de fallback est maintenant choisie selon la plateforme : `STORE_URLS.IOS` (env `STORE_URL_IOS`) sur iOS, `PLAY_STORE_RATE_URL` sur Android (auparavant, Play Store URL était utilisée sur iOS)
- 🐛 **`isManualMode` irréversible** — Bouton "Sync auto" ajouté dans `statistics.tsx`, visible uniquement quand `isManualMode === true`, qui réinitialise le mode auto et resynchronise la paire avec le convertisseur

#### Removed
- 🗑️ **Code mort supprimé** :
  - `apps/mobile/services/api/exchangeRateService.ts` — Service legacy ExchangeRate-API (remplacé par `backendService`)
  - `apps/mobile/services/api/historicalRatesService.ts` — Service legacy taux historiques (remplacé par `backendService`)
  - `apps/mobile/components/conversion/AmountInput.tsx` — Composant non utilisé
  - `IAP_CONFIG` dans `constants/config.ts` — Configuration achats in-app non intégrée
  - `STORAGE_KEYS.FAVORITES` et `STORAGE_KEYS.HISTORY` dans `CACHE_CONFIG` — Clés AsyncStorage inutilisées

---

### Phase 1 - Core Conversion ✅ [2025-11-17]

#### Added
- ✅ **Service API Exchange Rate**
  - Intégration avec ExchangeRate-API
  - Retry logic avec 3 tentatives
  - Gestion des erreurs et timeout (10s)
  - Rate limiting protection

- ✅ **Store Zustand avec Cache Mémoire**
  - Gestion d'état global pour les taux de change
  - Cache mémoire pour les données (persistance en session)
  - Auto-refresh logic avec cache de 1 heure
  - États de chargement et d'erreur

- ✅ **Hooks Custom**
  - `useCurrencyRates` - Auto-fetch et refresh des taux
  - `useConversion` - Conversion en temps réel avec debounce (300ms)
  - `useDebounce` - Hook utilitaire de debouncing

- ✅ **Composants UI**
  - `AmountInput` - Input numérique avec validation *(supprimé 2026-04-23 — non utilisé)*
  - `CurrencySelector` - Bouton de sélection de devise
  - `CurrencyPicker` - Modal avec recherche et 170+ devises
  - `ConversionResult` - Affichage résultat avec copie clipboard
  - `SwapButton` - Bouton animé d'inversion (Reanimated)
  - `RefreshButton` - Bouton refresh avec rotation
  - `LastUpdateBadge` - Badge temps depuis dernière MAJ

- ✅ **Écran Principal de Conversion**
  - Conversion instantanée avec debounce
  - Pull-to-refresh
  - Détection offline avec badge
  - Gestion des erreurs avec alertes
  - Support FR/EN complet

#### Changed
- 🔄 Remplacement de MMKV par cache mémoire
  - Raison: MMKV v4 incompatible avec Expo sans New Architecture
  - Solution temporaire: Cache JavaScript en mémoire
  - Migration AsyncStorage prévue Phase 2

#### Technical Details
- Architecture propre avec séparation des responsabilités
- Toutes les fonctions typées strictement (TypeScript)
- Optimisations performance (FlatList virtualisé, memoization)
- Animations fluides avec Reanimated
- Early return pattern et pure functions
- Pas de magic numbers, constantes nommées

### Phase 0 - Setup Initial ✅ [2025-11-16]

#### Added
- ✅ Installation de toutes les dépendances principales
  - Zustand (gestion d'état)
  - Cache mémoire (storage en session - Phase 1)
  - Axios (client HTTP)
  - Victory Native (graphiques)
  - date-fns (gestion des dates)
  - i18next + react-i18next (internationalisation)
  - Moti (animations)
  - expo-localization (détection langue système)
  - @react-native-community/netinfo (détection réseau)
  
- ✅ Structure complète des dossiers créée
  - `/app` - Navigation Expo Router avec 3 tabs
  - `/components` - Composants réutilisables
  - `/services` - Services externes (API, storage, i18n)
  - `/stores` - Stores Zustand
  - `/constants` - Configuration et constantes
  - `/types` - Types TypeScript
  - `/utils` - Fonctions utilitaires
  - `/hooks` - Custom hooks
  - `/locales` - Traductions FR/EN
  
- ✅ Configuration TypeScript stricte
  - Mode strict activé
  - Paths aliases configurés (@components, @services, etc.)
  - Types stricts pour toutes les entités
  
- ✅ Types de base créés
  - `Currency` - Représentation d'une devise
  - `ExchangeRate` - Taux de change
  - `ConversionResult` - Résultat de conversion
  - `HistoricalRate` - Taux historique
  - `UserSettings` - Paramètres utilisateur
  - Types API complets
  
- ✅ Liste complète de 170+ devises
  - Codes ISO 4217
  - Noms en Français et Anglais
  - Symboles de devises
  - Emojis drapeaux
  - Fonctions de recherche et filtrage
  
- ✅ Configuration et constantes
  - Configuration API (ExchangeRate-API)
  - Configuration cache et storage
  - Paramètres par défaut
  - Configuration UI (animations, limites, etc.)
  - Configuration AdMob (pour Phase 5)
  - Configuration Firebase (optionnel)
  - Configuration IAP
  
- ✅ Localisation complète FR/EN
  - Configuration i18next
  - Traductions complètes en Français
  - Traductions complètes en Anglais
  - Détection automatique de la langue système
  - Support du pluriel
  
- ✅ Utilitaires de base
  - `conversion.ts` - Logique de conversion de devises
  - `formatters.ts` - Formatage nombres et devises
  - `validators.ts` - Validations
  - `time.ts` - Utilitaires de temps
  
- ✅ Navigation configurée
  - 3 tabs : Converter, Favorites, Settings
  - Layouts avec i18n intégré
  - Support du mode sombre
  - Icônes FontAwesome appropriées
  
- ✅ Documentation complète
  - README.md mis à jour avec guide complet
  - SETUP.md créé avec instructions détaillées
  - CHANGELOG.md initialisé
  - IMPLEMENTATION_PLAN.md fourni
  
#### Changed
- Mis à jour tsconfig.json avec paths aliases
- Restructuré les tabs selon le plan MVP
- Supprimé le fichier obsolète `two.tsx`
- Supprimé le test obsolète `StyledText-test.js`

#### Technical Details
- Architecture: Clean Architecture avec séparation claire des responsabilités
- Code Quality: ESLint + Prettier configurés et fonctionnels
- Type Safety: TypeScript strict mode avec 0 any
- Internationalization: i18next prêt pour FR/EN
- State Management: Architecture prête pour Zustand
- Storage: Cache mémoire implémenté (AsyncStorage prévu Phase 2)
- Networking: Axios configuré pour les appels API

#### Notes techniques
> ⚠️ **MMKV retiré**: MMKV v4 nécessite la nouvelle architecture React Native (Turbo Modules) non activée dans Expo.  
> ✅ **Solution**: Cache mémoire JavaScript pour Phase 1, migration AsyncStorage prévue Phase 2.

### Prochaines étapes (Phase 1 - À venir)

- [ ] Service API pour récupération des taux
- [ ] Store Zustand pour l'état global
- [ ] Composants de conversion
- [ ] Écran principal de conversion fonctionnel
- [ ] Sélecteur de devises avec recherche

---

## Guide des émojis

- ✅ Complété
- 🚧 En cours
- 📝 Documentation
- 🐛 Bug fix
- 🚀 Nouvelle fonctionnalité
- ⚡ Performance
- 🎨 UI/UX
- 🔧 Configuration
- 📦 Dépendances

