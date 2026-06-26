# 💱 All Currency Converter

> Convertisseur de devises mobile avec support de 170+ devises, taux en temps réel, mode offline, graphiques historiques, abonnement premium, sauvegarde Google Drive et export CSV/PDF.

## 🏗️ Monorepo

```
.
├── apps/
│   ├── mobile/        # App React Native / Expo (Android + iOS)
│   └── api/           # Cloudflare Worker (Hono) — proxy ExchangeRate-API + cache KV
├── packages/
│   └── shared/        # Types et constantes partagés (currencies, contrats API)
├── docs/              # Spécifications, plans d'implémentation, design variants
├── ASO/               # App Store Optimization
└── artifacts/         # Release notes Play Store
```

Outils : **pnpm workspaces** + **Turborepo**.

## 🚀 Quick Start

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer les variables d'environnement
cp apps/mobile/.env.example apps/mobile/.env
# Éditer apps/mobile/.env (voir SETUP.md)

# 3. Démarrer
pnpm dev:mobile     # Expo dev server
pnpm dev:api        # Cloudflare Worker en local (wrangler dev)

# 4. Builds natifs
pnpm android        # expo run:android
pnpm ios            # expo run:ios
```

**📖 Guide complet de setup :** [SETUP.md](./SETUP.md)

## ✨ Fonctionnalités

### Conversion et données
- ✅ **170+ devises** avec codes ISO, noms localisés (20 langues), symboles, drapeaux
- ✅ **Conversion 1 → N** avec calcul instantané pour toutes les devises favorites
- ✅ **Mode offline** — taux pré-chargés (USD, EUR, GBP, JPY, CHF, CAD), fallback sur le cache
- ✅ **Calculatrice intégrée** dans l'écran de conversion (`+ − × ÷ %`)
- ✅ **Drag & drop** pour réorganiser les devises cibles

### Statistiques et historique
- ✅ Graphiques sur **7 / 30 / 90 / 270 / 365 jours**
- ✅ Mode auto (suit la paire active) ou manuel
- ✅ Cache TTL 24 h via TanStack Query persisté en MMKV

### Premium et monétisation
- ✅ **AdMob** : bannières par écran, interstitielles, récompensées
- ✅ **Période ad-free** après visionnage d'une rewarded ad (durée configurable à distance)
- ✅ **Abonnement premium (RevenueCat)** : essai 7 jours, plans mensuel et annuel
  - Sans publicités
  - Sauvegarde Google Drive
  - Export CSV / PDF
- ✅ **Paywall modal** déclenchable depuis n'importe quelle source (`openPaywall({ source })`)

### Sauvegarde et export
- ✅ **Google Drive AppData** (Android) — settings, devises favorites, dernière conversion, état de notation, ad-free, préférences d'export
- ✅ **Export CSV / PDF** : conversion courante, données historiques, tous les taux

### Système
- ✅ **20 langues** avec chargement lazy, support **RTL** (ar)
- ✅ **Thème clair / sombre / auto** (NativeWind)
- ✅ **Notation in-app** progressive (7 gates avec thresholds)
- ✅ **Firebase Analytics + Crashlytics**
- ✅ **Onboarding** 4 étapes (welcome, showcase, currency picker, ready)

## 🛠 Stack technique

### App mobile (`apps/mobile`)
| Domaine | Technologie |
|---|---|
| Framework | Expo SDK 54, React Native 0.81.5, React 19 |
| Navigation | Expo Router 6 (file-based) |
| State | Zustand 5 + middleware `persist` (MMKV) |
| Data fetching | TanStack Query 5 + persister (MMKV) |
| Storage | react-native-mmkv 3 (sync, ~30× plus rapide qu'AsyncStorage) |
| HTTP | Axios + retry exponentiel |
| UI | NativeWind 4, Reanimated 4, Moti, expo-linear-gradient, expo-blur |
| Charts | react-native-chart-kit |
| i18n | i18next + react-i18next (20 langues, lazy) |
| Dates | date-fns |
| IAP | react-native-purchases (RevenueCat) |
| Backup | @react-native-google-signin/google-signin + Google Drive AppData |
| Export | expo-print, expo-sharing, expo-file-system |
| Ads | react-native-google-mobile-ads |
| Firebase | @react-native-firebase/{app, analytics, crashlytics} |
| Tests | Vitest + @testing-library/react-native |

### Backend (`apps/api`)
- **Cloudflare Workers** + **Hono** (TypeScript)
- **KV** (`RATE_CACHE`) pour cache des taux et incremental cache des points historiques
- Middleware : rate limiter (30 req/IP/60s) + auth par clé API
- Tests : Vitest

### Shared (`packages/shared`)
- Build via **tsup**, exporte types API et liste de devises

## 📁 Structure (mobile)

```
apps/mobile/
├── app/                      # Routes Expo Router
│   ├── _layout.tsx
│   ├── index.tsx             # Convertisseur (tab 1)
│   ├── statistics.tsx        # Statistiques (tab 2)
│   └── settings.tsx          # Paramètres (tab 3)
├── components/
│   ├── ads/                  # AdBanner, RewardedAdButton
│   ├── calculator/           # Calculatrice intégrée
│   ├── charts/               # ExchangeRateChart, StatisticsCard
│   ├── conversion/           # SourceCard, TargetCurrencyList, TargetCurrencyRow
│   ├── currency/             # Pickers et sélecteurs de devises
│   ├── export/               # ExportBottomSheet, ExportSplitButton, ExportGateSheet
│   ├── layout/               # BackupBootstrap, MigrationLoadingScreen, TelemetryEffects
│   ├── onboarding/           # OnboardingScreen + 4 étapes
│   ├── paywall/              # PaywallModal, PaywallPlanCard
│   ├── premium-gates/        # Gates UI réutilisables
│   ├── settings/             # Sections (Display, Backup, Legal, etc.)
│   ├── statistics/           # Sélecteurs paire et période
│   └── ui/                   # GradientButton, ModalBottomSheet, RatingModal, ...
├── constants/                # config, currencies, languages, admob, purchases, ...
├── contexts/                 # SubscriptionContext
├── hooks/                    # useConversion, useMultiConversion, usePremium, ...
├── i18n/                     # service.ts + languages/*.json (20 langues)
├── providers/                # Theme, Toast, Query, Subscription, AdFree
├── services/
│   ├── api/                  # backendService, purchaseService, exportService, ...
│   └── storage/              # mmkv, adapter, keys, migration, domains/
├── stores/                   # 7 stores Zustand
├── types/                    # currency, settings, statistics, api, backup
└── utils/                    # conversion, formatters, retry, rtl, haptics, ...
```

## 📦 Scripts

À la racine :

```bash
pnpm dev              # Turbo dev (toutes apps)
pnpm dev:mobile       # Expo dev server
pnpm dev:api          # Wrangler dev
pnpm android          # expo run:android
pnpm ios              # expo run:ios
pnpm build            # Turbo build
pnpm lint             # Turbo lint
pnpm format           # Turbo format
pnpm test             # Vitest (toutes apps)
pnpm deploy:api       # Déploiement Cloudflare Worker
```

Mobile-only (`apps/mobile`) :

```bash
pnpm preb             # expo prebuild
pnpm preb:android     # prebuild Android
pnpm preb:ios         # prebuild iOS
pnpm test             # vitest run
pnpm analyze          # source-map-explorer (audit bundle)
```

## 🔧 Configuration

Toutes les clés sont injectées via `apps/mobile/.env` puis lues dans `apps/mobile/app.config.js`.

| Clé | Rôle |
|---|---|
| `BACKEND_URL`, `BACKEND_API_KEY` | API custom (Cloudflare Worker) |
| `EXCHANGE_RATE_API_KEY` | Côté Worker uniquement (secret Cloudflare) |
| `ADMOB_*` | App IDs + Ad Unit IDs Android/iOS, feature flags |
| `REVENUECAT_IOS_API_KEY`, `REVENUECAT_ANDROID_API_KEY` | RevenueCat |
| `FORCE_FREE` | Force le mode gratuit (dev) |
| `GOOGLE_WEB_CLIENT_ID` | OAuth Web Client ID (Google Drive backup) |
| `LEGAL_*`, `STORE_URL_IOS`, `STORE_URL_ANDROID`, `APP_WEBSITE_URL` | URLs publiques |
| `RTL_RESTART_BANNER_ENABLED` | Toggle bannière de redémarrage RTL |
| `AD_REWARDED_FREE_DURATION_MINUTES` | Durée de la session ad-free (défaut 60) |

Voir [`apps/mobile/.env.example`](./apps/mobile/.env.example) pour la liste complète.

## 💰 Monétisation

### AdMob
- **Bannières** par écran (`index`, `statistics`, `settings`) — masquées en ad-free ou premium
- **Interstitielles** : après 5 conversions (3 après J+7), intervalle minimum 2 min, lazy-init
- **Récompensées** : visionnage volontaire, active une session ad-free (60 min par défaut)
- Collision interstitial / modale de notation gérée (fenêtre 2 min)

### Premium (RevenueCat)
- **Entitlement** : `Currency converter Pro`
- **Plans** : mensuel et annuel, essai 7 jours
- Synchronisation au foreground, restore explicite, paywall typé `openPaywall({ source })`
- Gates : ad-free permanent, sauvegarde Google Drive, export CSV/PDF

## 🧪 Tests

Vitest sur les deux apps. Suites mobile sous `apps/mobile/test/` (hooks, services, storage, stores, utils). Suites API sous `apps/api/test/`.

```bash
pnpm test               # Toutes les suites
pnpm --filter mobile test
pnpm --filter api test
```

## 📚 Documentation interne

- [SETUP.md](./SETUP.md) — Setup initial, configuration et dépannage
- [CHANGELOG.md](./CHANGELOG.md) — Historique des versions
- [CLAUDE.md](./CLAUDE.md) — Guide pour Claude Code (architecture, conventions)
- [apps/mobile/PROJECT_CONTEXT.md](./apps/mobile/PROJECT_CONTEXT.md) — Contexte détaillé de l'app mobile
- `docs/` — Spécifications, plans, design variants
- `ASO/` — Naming et descriptions store

## 📄 Licence

MIT — voir [LICENSE](./LICENSE).

## 🙏 Remerciements

- Taux fournis par [ExchangeRate-API](https://www.exchangerate-api.com/) (proxifié via Cloudflare Worker)
- Drapeaux : emojis Unicode

---

**Fait avec ❤️ en utilisant React Native, Expo et Cloudflare Workers**
