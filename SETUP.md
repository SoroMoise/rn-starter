# 🚀 Setup Guide — All Currency Converter

Ce guide accompagne la configuration du monorepo (app mobile + backend Cloudflare Worker).

## 📋 Prérequis

- **Node.js** 20+
- **pnpm** 10.32+ (`corepack enable` + `corepack prepare pnpm@10.32.0 --activate`)
- **Expo CLI** (via `npx expo`)
- **Wrangler** (Cloudflare Workers CLI) — installé en devDependency dans `apps/api`
- **Android Studio** (SDK + émulateur) pour Android
- **Xcode** + **CocoaPods** pour iOS (macOS uniquement)
- Compte **ExchangeRate-API** (clé gratuite : 1500 req/mois)
- Compte **Cloudflare** (Workers + KV) pour le backend
- (Optionnel) Compte **AdMob**, **RevenueCat**, **Firebase**, **Google Cloud** (OAuth Drive)

## 🏗️ Structure du monorepo

```
all-currency-converter/
├── apps/
│   ├── mobile/          # App React Native / Expo
│   └── api/             # Cloudflare Worker (Hono)
├── packages/
│   └── shared/          # Types et constantes partagés
├── pnpm-workspace.yaml
└── turbo.json
```

## 1️⃣ Installation

```bash
# Cloner et installer
git clone <repo-url> all-currency-converter
cd all-currency-converter
pnpm install
```

`pnpm install` installe les dépendances de toutes les workspaces (`apps/*`, `packages/*`).

## 2️⃣ Configuration de l'app mobile

### Variables d'environnement

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Éditer `apps/mobile/.env`. Les clés sont lues dans `apps/mobile/app.config.js` puis exposées via `Constants.expoConfig?.extra`.

#### Variables minimales pour démarrer

| Clé | Description |
|---|---|
| `BACKEND_URL` | URL du Worker (ex. `http://localhost:8787` en dev) |
| `BACKEND_API_KEY` | Clé d'auth (header `x-api-key`) |
| `APP_WEBSITE_URL`, `LEGAL_*`, `STORE_URL_IOS`, `STORE_URL_ANDROID` | URLs publiques |

#### Variables AdMob (peuvent rester aux placeholders en dev — TestIds utilisés)

```
ADMOB_ANDROID_APP_ID, ADMOB_IOS_APP_ID
ADMOB_ANDROID_BANNER_INDEX_ID / STATISTICS_ID / SETTINGS_ID
ADMOB_IOS_BANNER_INDEX_ID / STATISTICS_ID / SETTINGS_ID
ADMOB_ANDROID_INTERSTITIAL_ID, ADMOB_IOS_INTERSTITIAL_ID
ADMOB_ANDROID_REWARDED_ID, ADMOB_IOS_REWARDED_ID
AD_BANNER_*_ENABLED, AD_INTERSTITIAL_ENABLED, AD_REWARDED_ENABLED
AD_REWARDED_FREE_DURATION_MINUTES   # défaut 60
```

#### Variables RevenueCat (premium)

```
REVENUECAT_IOS_API_KEY=appl_...
REVENUECAT_ANDROID_API_KEY=goog_...
FORCE_FREE=true   # pour désactiver le premium en dev
```

#### Variables Google Drive backup (Android)

```
GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
```

OAuth 2.0 Web Client ID issu du même projet Google Cloud que Firebase (scope `drive.appdata`).

### Firebase (Android)

Placer le fichier `google-services.json` à la racine de `apps/mobile/`. Référencé dans `app.config.js` via `android.googleServicesFile`. Plugin `@react-native-firebase/app` + `@react-native-firebase/crashlytics` activés.

iOS : ajouter `GoogleService-Info.plist` lors d'un build natif.

## 3️⃣ Configuration du backend (`apps/api`)

### Secrets et bindings

`apps/api/wrangler.toml` définit :
- `vars.CACHE_TTL_SECONDS = "3600"`
- KV binding `RATE_CACHE`

Configurer les secrets via `wrangler` :

```bash
cd apps/api
npx wrangler secret put EXCHANGE_RATE_API_KEY
npx wrangler secret put API_KEY            # même valeur que BACKEND_API_KEY côté mobile
```

En local, créer `apps/api/.dev.vars` :

```
EXCHANGE_RATE_API_KEY=xxx
API_KEY=xxx
```

### Démarrer le worker

```bash
pnpm dev:api
# Worker sur http://localhost:8787 (avec --ip 0.0.0.0 pour accès depuis l'émulateur)
```

Endpoints :
- `GET /` — health check
- `GET /rates/:base` — taux courants (cache KV 1 h)
- `GET /rates/:base/history?target=XXX&days=7|30|90|270|365` — historique + statistiques

Auth : header `x-api-key`. Rate limit : 30 req/IP/60s.

## 4️⃣ Démarrer l'app mobile

```bash
# Depuis la racine
pnpm dev:mobile

# ou directement
pnpm --filter mobile start
```

Builds natifs :

```bash
pnpm android        # expo run:android
pnpm ios            # expo run:ios
```

Régénérer les projets natifs (après modif de `app.config.js` ou plugins) :

```bash
pnpm --filter mobile preb            # expo prebuild
pnpm --filter mobile preb:android
pnpm --filter mobile preb:ios
```

## 5️⃣ Commandes utiles

```bash
# Tests
pnpm test                          # Vitest sur toutes les apps
pnpm --filter mobile test
pnpm --filter mobile test:watch
pnpm --filter api test

# Qualité
pnpm lint
pnpm format

# Audit bundle (mobile)
pnpm --filter mobile analyze       # source-map-explorer → report.html

# Déploiement
pnpm deploy:api                    # wrangler deploy
```

## 🐛 Dépannage

### Modules non résolus / aliases TS
```bash
pnpm install --force
```

### Cache Metro bloqué
```bash
pnpm --filter mobile start --clear
```

### Pods iOS
```bash
cd apps/mobile/ios && pod install && cd -
```

### Build Android
```bash
cd apps/mobile/android && ./gradlew clean && cd -
```

### Migration AsyncStorage → MMKV bloquée
La migration est idempotente et tournée une seule fois (clé `@migration_done`). En cas de pépin sur un device, désinstaller / réinstaller suffit. Le code est dans `apps/mobile/services/storage/migration.ts`.

### Premium toujours actif en dev
Mettre `FORCE_FREE=true` dans `.env` puis relancer le bundler.

## 🔐 Configuration optionnelle approfondie

| Domaine | Document |
|---|---|
| AdMob (production) | Voir variables `ADMOB_*` dans `apps/mobile/.env.example` |
| RevenueCat | Dashboard → API keys + Offerings (`premium-monthly`, `premium-yearly`) |
| Google Drive backup | OAuth Web Client ID + scope `drive.appdata` dans Google Cloud Console |
| Firebase | Crashlytics activé via plugin `app.config.js`, Analytics auto |

## 📚 Documentation associée

- [README.md](./README.md) — Vue d'ensemble du projet
- [CHANGELOG.md](./CHANGELOG.md) — Historique des versions
- [CLAUDE.md](./CLAUDE.md) — Guide Claude Code
- [apps/mobile/PROJECT_CONTEXT.md](./apps/mobile/PROJECT_CONTEXT.md) — Contexte détaillé mobile

## ✅ Checklist de premier démarrage

- [ ] `pnpm install` à la racine
- [ ] `apps/mobile/.env` créé avec au minimum `BACKEND_URL` et `BACKEND_API_KEY`
- [ ] `google-services.json` placé dans `apps/mobile/` (Android)
- [ ] `apps/api/.dev.vars` créé avec `EXCHANGE_RATE_API_KEY` et `API_KEY`
- [ ] `pnpm dev:api` démarre le Worker
- [ ] `pnpm dev:mobile` démarre Expo
- [ ] App lance l'onboarding (4 étapes) puis le convertisseur
