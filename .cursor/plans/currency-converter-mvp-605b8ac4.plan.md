<!-- 605b8ac4-4475-4d18-9a51-e98f9839f0d8 34a3a635-d4fe-40c6-8919-091ec05ae517 -->
# Plan d'Implémentation - All Currency Converter MVP

> **Mis à jour le 2026-04-23** — Version courante : **1.70.1**. Statut : ✅ = réalisé | 🔄 = modifié/pivoté | ❌ = abandonné | ⏳ = en attente

---

## Architecture Technique

**Stack initiale → Stack réelle :**

| Prévu | Réel |
|---|---|
| React Native (Expo) + TypeScript strict | ✅ Expo SDK 54, RN 0.81.5, React 19 |
| Zustand (état global) | ✅ Zustand v5 |
| React Navigation (tabs + stack) | 🔄 Expo Router (file-based routing) |
| Reanimated + Moti | 🔄 Reanimated v3 (Moti abandonné) |
| Victory Native (graphiques) | 🔄 react-native-chart-kit (essai gifted-charts, revenu à chart-kit) |
| MMKV (storage haute performance) | 🔄 AsyncStorage (+ persist middleware Zustand) |
| Axios (API) | ✅ Axios avec retry 3 tentatives + backoff exponentiel |
| expo-sqlite (historique local) | 🔄 AsyncStorage |

**APIs :**

| Prévu | Réel |
|---|---|
| ExchangeRate-API directe | 🔄 Via backend Cloudflare Workers (`backendService.ts`) |
| CoinGecko (cryptos) | ❌ Non implémenté |
| RevenueCat / expo-iap | ❌ Abandonné — modèle premium abandonné |
| AdMob | ✅ `react-native-google-mobile-ads` (banner + rewarded) |

**Architecture réelle (non prévue) :**
- ✅ **Monorepo pnpm/Turborepo** : `apps/mobile`, `apps/api` (Cloudflare Workers + Hono), `packages/shared`
- ✅ **Backend propre** : rate limiter KV, auth par `x-api-key`, cache 1h/24h
- ✅ **NativeWind v4** (Tailwind CSS for RN) au lieu de styled-components

**Structure :**

```
apps/
├── api/                          # ✅ Cloudflare Workers (Hono)
│   └── src/
│       ├── index.ts              # ✅ Rate limiter + auth appliqués
│       ├── middleware/auth.ts    # ✅
│       ├── middleware/rateLimiter.ts # ✅ (30 req/IP/60s via KV)
│       └── routes/rates.ts + history.ts
└── mobile/
    ├── app/                      # ✅ Expo Router
    │   ├── _layout.tsx           # ✅ Providers, onboarding gate, RTLRestartBanner
    │   ├── index.tsx             # ✅ Convertisseur
    │   ├── statistics.tsx        # ✅ Graphiques + stats
    │   └── settings.tsx          # ✅ Paramètres
    ├── components/
    │   ├── calculator/           # ✅ Clavier calculatrice custom
    │   ├── charts/               # ✅ ExchangeRateChart (chart-kit + PanResponder)
    │   ├── conversion/           # ✅ SourceCard, TargetCurrencyRow, TargetCurrencyList
    │   ├── onboarding/           # ✅ OnboardingScreen + étapes + sélecteur langue
    │   └── ui/                   # ✅ SlidingSelector, RTLRestartBanner, RatingModal...
    ├── stores/                   # ✅ currencyStore, settingsStore, quickConversionsStore,
    │                             #    onboardingStore, statisticsStore (pas de persist ⏳)
    ├── services/api/             # ✅ backendService, ratingService, analyticsService...
    ├── hooks/                    # ✅ useCalculator, useRTL, useThemedColor, useAppRating...
    └── utils/                    # ✅ evaluateExpression, formatters, rtl, haptics...
```

---

## Stratégie de Monétisation

### Version Gratuite — ✅ IMPLÉMENTÉ (avec modifications)

- ✅ Conversion illimitée (170+ devises)
- ✅ Mode offline complet (fallback 6 devises majeures)
- ✅ Quick Conversions (drag-to-reorder) — remplace "Favoris" classiques
- ✅ Graphiques historiques (7J, 1M, 3M, 6M, 1Y)
- ❌ Alertes de taux — non implémenté
- ❌ Cryptomonnaies — non implémenté
- ✅ Multi-conversion (one-to-many via `useMultiConversion`)
- ✅ Banner AdMob + Rewarded Ad (1h sans pub)

### Version Premium — ⏳ À VENIR

Le modèle d'abonnement (RevenueCat, 2.99€/mois) est prévu mais pas encore implémenté.
**En attendant :** rewarded ad = 1 heure sans publicité (solution temporaire).

---

## Phase 1: Core Conversion — ✅ DONE

- ✅ Types (`/types/currency.ts`)
- ✅ `currencyStore.ts` (Zustand + AsyncStorage persist)
- ✅ `backendService.ts` (remplace `exchangeRateService.ts` supprimé)
- ✅ Écran convertisseur (`app/index.tsx`) : input, sélecteurs, swap animé, copie, badge MAJ
- ✅ `CurrencyPicker` (modal + recherche + FlashList)
- ✅ **Calculatrice custom** (non prévu) : `useCalculator.ts` + `evaluateExpression.ts` + `components/calculator/`
- ✅ **SlidingSelector** (non prévu) : `components/ui/SlidingSelector.tsx`

## Phase 2: Favoris & Offline — ✅ DONE (pivoté)

- 🔄 `quickConversionsStore.ts` remplace `favoritesStore.ts`
- 🔄 Quick Conversions intégrées dans l'écran convertisseur (pas d'onglet dédié)
- ✅ Drag-to-reorder (quick conversions)
- ✅ Mode offline : `@react-native-community/netinfo`, fallback AsyncStorage, badge hors-ligne
- ✅ Auto-refresh quand réseau revient

## Phase 3: Graphiques & Historique — ✅ DONE (partiel)

- ✅ `backendService.fetchHistoricalRates()` (remplace `historicalRatesService.ts` supprimé)
- ✅ `ExchangeRateChart` (chart-kit, pas Victory Native) — tooltip interactif via PanResponder
- ✅ Onglet statistiques dédié (`app/statistics.tsx`) : min/max/moyenne, sélecteur période
- ✅ Auto-sync paire avec convertisseur + bouton reset manuel (`isManualMode`)
- ❌ Alertes de taux push — non implémenté
- ❌ Cryptomonnaies — non implémenté
- ⏳ Cache offline statistiques (historique non persisté dans AsyncStorage)
- ⏳ `statisticsStore` sans middleware `persist` (reset à chaque démarrage)

## Phase 4: Paramètres & UX — ✅ DONE

- ✅ `settingsStore.ts` : theme, decimals, thousandSeparator, language, notificationsEnabled
- ✅ `app/settings.tsx` : thème, langue, décimales, séparateur, notation
- ✅ i18n : **19 langues** (FR, EN, ES, DE, AR, ZH, JA, KO, PT, RU, IT, NL, PL, TR, HI, ID, VI, TH, SV)
- ✅ `formatters.ts` : formatAmount, formatCurrency, formatDate
- ✅ **Support RTL/Arabe** (non prévu) : `useRTL.ts`, `rtl.ts`, `RTLRestartBanner` (15s countdown)

## Phase 5: Monétisation — 🔄 PIVOTÉ

- ✅ AdMob banner (bas écran)
- ✅ Rewarded Ad → 1h sans pub (`AdFreeProvider`, `RewardedAdButton`)
- ⏳ Abonnements IAP (RevenueCat — à venir)
- ⏳ Paywall (écran premium — à venir)
- ⏳ Backup cloud Firebase (à venir, fonctionnalité premium)
- ⏳ Export CSV/PDF (à venir, fonctionnalité premium)
- ✅ **Système de notation** (non prévu) : `useAppRating.ts`, `AppRatingModal`, `RatingModal`, `ratingService.ts`
  - Fallback iOS App Store URL ✅
  - Throttle multi-portes (conversions, jours, sessions) ✅

## Phase 6: Analytics & Optimisation — ✅ DONE

- ✅ Firebase Analytics enrichi : 15+ événements avec paramètres contextuels (object params)
- ✅ Crashlytics
- ✅ `analyticsService.ts` : toutes méthodes refactorisées en object params
- ❌ A/B Testing (Firebase Remote Config) — non implémenté

## Phase 7: Onboarding & Polish — ✅ DONE

- ✅ Onboarding multi-écrans (`app/onboarding/`)
- ✅ **Sélecteur de langue dans l'onboarding** (non prévu) — `OnboardingScreen.tsx`
- ✅ Animations Reanimated (swap, modals, clavier calculatrice)
- ✅ Dark mode (auto + manuel)
- ✅ `useThemedColor.ts` hook (retourne `isDark: boolean`)

## Phase 8: Tests & Publication — 🔄 EN COURS

- ✅ Builds EAS : version **1.70.1** publiée
- ❌ Tests unitaires mobile (zéro tests dans `apps/mobile/`) ⏳
- ✅ Backend testé (`apps/api/test/`)

---

## Checklist MVP Final

### Fonctionnalités Core

- [x] Conversion 170+ devises (temps réel)
- [x] Sélecteur avec recherche
- [x] Swap animé
- [x] Copie résultat
- [x] Quick Conversions (remplace Favoris classiques)
- [x] Mode offline
- [x] Graphiques historiques (7J, 1M, 3M, 6M, 1Y)
- [ ] Alertes de taux ⏳
- [ ] Cryptomonnaies ❌ hors scope actuel
- [x] Multi-conversion (one-to-many)
- [x] Thème clair/sombre
- [x] Localisation 19 langues (FR/EN + 17 autres)
- [x] Support RTL (Arabe)
- [x] Calculatrice mathématique custom

### Monétisation

- [x] AdMob banner
- [x] Rewarded Ad (1h sans pub)
- [ ] Abonnements IAP (RevenueCat) ⏳ à venir
- [ ] Paywall ⏳ à venir
- [ ] Backup cloud Firebase ⏳ à venir
- [ ] Export CSV/PDF ⏳ à venir
- [x] Système de notation in-app (auto + manuel)

### Analytics & Quality

- [x] Firebase Analytics (15+ événements enrichis)
- [x] Crashlytics
- [ ] A/B Testing (Remote Config) ❌ non implémenté
- [ ] Tests unitaires mobile ⏳
- [x] Tests backend (`apps/api/test/`)
- [x] Rate limiter backend (30 req/IP/60s)

### Publication

- [x] Builds signés EAS (v1.70.1)
- [ ] Screenshots (5) — à compléter
- [ ] Description store ASO-optimisée — à compléter
- [ ] Privacy Policy — à compléter
- [ ] Beta testing — à compléter

---

## Backlog actuel (⏳ en attente)

> Voir aussi `docs/superpowers/plans/2026-04-23-improvements-backlog.md` pour le détail technique.

| # | Item | Priorité |
|---|---|---|
| 1 | `statisticsStore` : ajouter middleware `persist` AsyncStorage | Haute |
| 2 | Cache offline statistiques (historique dans AsyncStorage) | Moyenne |
| 3 | Renommer `useThemedColor` → `useIsDarkMode` (retourne boolean, nom trompeur) | Basse |
| 4 | Remplacer `react-native-chart-kit` (non maintenu) par une lib active | Basse |
| 5 | Tests unitaires mobile (`useCalculator`, `useAppRating`, `evaluateExpression`, `formatters`) | Haute |

---

## Fonctionnalités non prévues implémentées

| Feature | Plan superpowers |
|---|---|
| Monorepo pnpm + Cloudflare Workers backend | `2026-03-22-monorepo-backend-plan.md` |
| API historique via backend | `2026-03-22-historical-rates-api.md` |
| Calculatrice keyboard custom | `2026-03-27-calculator-keyboard.md` |
| One-to-many converter | `2026-03-28-one-to-many-converter.md` |
| SlidingSelector devise | `2026-03-31-sliding-selector.md` |
| `useThemedColor` hook | `2026-04-06-useThemedColor-refactoring.md` |
| Système de notation | `2026-04-10-rating-system.md` |
| Sélecteur langue onboarding | `2026-04-11-onboarding-language-selector.md` |
| Optimisations performance | `2026-04-13-performance-optimizations.md` |
| Analytics enrichies | `2026-04-16-analytics-enrichment.md` |
| Support RTL/Arabe | `2026-04-21-rtl-arabic-support.md` |

---

## Priorités Post-MVP

**Toujours pertinents :**
- [ ] Widgets home screen (Android/iOS)
- [ ] Alertes de taux (push notifications)
- [ ] Plus de cryptos

**Déprioritisés :**
- ❌ Mode voyage (calculatrice intégrée) — calculatrice déjà dans le converter
- ❌ Comparaison multi-devises — déjà couvert par one-to-many
- ❌ Social sharing
- ❌ Referral program

---

## Estimation Temps

**Initial : 26-32 jours** — **Réel : ~5 mois** (Nov 2025 → Avr 2026, développement itératif)

- Phase 1 Core: ✅
- Phase 2 Favoris/Offline: ✅
- Phase 3 Graphiques: ✅ (partiel — pas d'alertes ni crypto)
- Phase 4 Settings: ✅
- Phase 5 Monétisation: 🔄 pivoté (rewarded ad sans IAP)
- Phase 6 Analytics: ✅
- Phase 7 Polish: ✅
- Phase 8 Publication: 🔄 en cours (v1.70.1 publiée, store listing à finaliser)
