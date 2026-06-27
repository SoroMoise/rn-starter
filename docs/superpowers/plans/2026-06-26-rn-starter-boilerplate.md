# rn-starter Boilerplate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produire `rn-starter/`, un boilerplate Expo/monorepo, en copiant l'app de production `all-currency-converter` puis en retirant tout le métier « conversion de devises », tout en conservant et **généralisant** l'infrastructure premium (monétisation, paywall contextuel, notifications, i18n).

**Architecture:** Opération **soustractive**. On part d'une base qui build déjà, et on retire/généralise couche par couche (`shared` → `api` → `mobile`). Le métier est par endroits **infiltré dans des services génériques** (le paywall contextuel, la cadence des pubs et le rating se déclenchaient « après N conversions ») : ces points sont **découplés et généralisés** (compteur d'actions générique) avant la purge. Comme le projet n'a **aucun test unitaire**, la « boucle rouge/vert » du TDD est remplacée par des **checkpoints de vérification** : `typecheck` + `lint` + `build` verts à la fin de chaque tâche. Les imports orphelins créés par les suppressions sont détectés par `typecheck` et corrigés dans la même tâche.

**Tech Stack:** Expo SDK 54 + Expo Router, React Native, NativeWind v4, Zustand v5, TanStack Query v5, i18next (**20 langues**), Firebase (Analytics + Crashlytics), AdMob, RevenueCat, Hono + Cloudflare Workers (api), pnpm 10 + Turborepo, TypeScript strict.

## Global Constraints

- Dossier cible : `/home/colotcholoman/project/rn-starter/` (créé Task 1, historique git neuf, branche `main`).
- Nom du package racine : `rn-starter`. Package partagé : `@repo/shared`. Packages applicatifs : `mobile`, `api`.
- Ne **jamais** committer de secret/identité réels : `.env`, `.dev.vars`, `google-services.json`, `GoogleService-Info.plist`, `release.keystore`, `keystore.properties`, EAS project id, bundle ids → placeholders. (`.gitignore` les couvre déjà depuis Task 1 ; `debug.keystore` est volontairement suivi — clé de debug Android non secrète.)
- À conserver intact : patches (`expo-notifications`), `apps/mobile/plugins/`, config Turbo/pnpm/EAS.
- Zones grises tranchées : **alertes conservées** (généralisées en rappels programmés locaux), **backup Google Drive retiré**, **export retiré**.
- **Décision premium (déclencheurs)** : les déclencheurs aujourd'hui basés sur « N conversions » (paywall contextuel, rating, cadence interstitiels) deviennent un **compteur d'actions générique** porté par `engagementStorage` (`incrementAction()` / `getActionCount()`), que l'intégrateur câble sur ses propres événements à valeur. On garde toute la mécanique premium.
- **Qualité premium** : les écrans construits (home, settings) utilisent le **design system existant** (`components/ui`, tokens de thème, `GradientButton`, animations Moti/Reanimated) — **jamais** de primitives RN brutes stylées à la main.
- Vérification « zéro métier » (sémantique, pas littérale) à la fin du bloc mobile : `rg -in 'currency|conversion|exchange|from_currency|to_currency|\brates?\b' apps/mobile --glob '!node_modules' --glob '!ios/**' --glob '!android/**'` ne renvoie rien dans le code applicatif. **Ne pas** flagger le sous-système de *rating* (app-store review : `markAsRated`, `handleRateApp`, `useAppRating`, `ratingService`) — le mot « rate » y est légitime et ce sous-système est générique et conservé.
- **Découverte (analytics) :** `services/api/analyticsService.ts` définit `AnalyticsEventMap` (catalogue typé d'événements) contenant des événements métier (`conversion_performed`, `from_currency`, `total_conversions`, `conversion_count`), et `hooks/useAppRating.ts` un `CheckRatingContext.totalSuccessfulConversions`. Ces noms sont généralisés en **Task 11** (après la purge).
- **Ordre d'exécution du bloc mobile :** 4 (fait) → 5 (purge) → 6 (alertes) → 11 (analytics + rating context) → 7 (layout + home) → 8 (settings + i18n, **checkpoint typecheck complet vert ici**) → 9 (outillage) → 10 (archivage). Les tâches mobiles intermédiaires n'ont que des checkpoints *scoped* (le typecheck mobile complet n'est exigé qu'en Task 8).
- Commits : messages en **anglais**, format **Conventional Commits**. Terminer chaque message par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Suppressions via `git rm` pour garder l'index propre.

---

### Task 1: Bootstrap du dépôt `rn-starter` — ✅ TERMINÉE (commit 5283b1c)

Déjà réalisée par le contrôleur. Pour mémoire : copie filtrée d'`all-currency-converter` (sans `node_modules`/builds/caches), `git init` sur `main`, scripts `typecheck` ajoutés (racine + 3 packages), `turbo.json` tâche `typecheck`, `apps/api/tsconfig.json` corrigé (`"lib": ["ES2022"]` pour éviter le conflit DOM/Workers), nom racine → `rn-starter`, secrets gitignorés, doc métier retirée, spec + plan copiés dans `docs/superpowers/`. **Baseline verte** : `typecheck` PASS sur `shared` + `api` + `mobile`, `shared build` OK.

**Ne pas réexécuter.** Reprendre à Task 2.

---

### Task 2: Démétiérisation de `packages/shared`

**Files:**
- Modify (réécriture complète): `packages/shared/src/types/api.ts`
- Modify (réécriture complète): `packages/shared/src/index.ts`
- Modify: `packages/shared/tsup.config.ts` (retirer l'entrée `constants/currencies`)
- Modify: `packages/shared/package.json` (retirer l'export `./constants/currencies`)
- Delete: `packages/shared/src/constants/currencies.ts` (et le dossier `constants/` s'il devient vide)

**Interfaces:**
- Consumes: rien.
- Produces: `@repo/shared` exporte `HealthResponse` et `ApiErrorResponse`. Plus aucun export `ExchangeRateResponse`, `HistoricalRatesResponse`, `RateAlert`, `CURRENCY_LIST`, `CurrencyInfo`, ni sous-chemin `./constants/currencies`.

- [ ] **Step 1: Supprimer les constantes métier**

```bash
cd /home/colotcholoman/project/rn-starter
git rm packages/shared/src/constants/currencies.ts
```

- [ ] **Step 2: Remplacer `types/api.ts` par des types génériques**

Écraser `packages/shared/src/types/api.ts` avec :

```ts
/** Réponse de l'endpoint de santé de l'API. */
export interface HealthResponse {
  status: 'ok'
  timestamp: number
}

/** Forme standard d'une erreur renvoyée par l'API. */
export interface ApiErrorResponse {
  error: string
}
```

- [ ] **Step 3: Remplacer `index.ts`**

Écraser `packages/shared/src/index.ts` avec :

```ts
export type { HealthResponse, ApiErrorResponse } from './types/api'
```

- [ ] **Step 4: Retirer l'entrée currencies de `tsup.config.ts`**

Le fichier liste explicitement les entrées. Le réécrire ainsi :

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/types/api.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
})
```

- [ ] **Step 5: Retirer l'export `./constants/currencies` de `package.json`**

Dans `packages/shared/package.json`, supprimer le bloc d'export :

```json
"./constants/currencies": {
  "types": "./dist/constants/currencies.d.ts",
  "import": "./dist/constants/currencies.js"
}
```

(garder les exports `.` et `./types/api`).

- [ ] **Step 6: Checkpoint**

Run: `pnpm --filter @repo/shared build && pnpm --filter @repo/shared typecheck`
Expected: build (tsup) + typecheck PASS, et `dist/constants/` n'est plus généré.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: strip currency domain types from shared package"
```

---

### Task 3: Démétiérisation de `apps/api`

**Files:**
- Delete: `apps/api/src/services/exchangeRate.ts`, `apps/api/src/services/historicalRates.ts`
- Delete: `apps/api/src/routes/rates.ts`, `apps/api/src/routes/history.ts`, `apps/api/src/routes/alerts.ts`
- Delete: `apps/api/src/handlers/cron.ts`
- Delete: `apps/api/src/utils/supportedCurrencies.ts`, `apps/api/src/utils/alertNormalize.ts`
- Create: `apps/api/src/routes/example.ts`
- Modify (réécriture complète): `apps/api/src/index.ts`, `apps/api/src/types.ts`
- Modify: `apps/api/wrangler.toml`
- Keep: `apps/api/src/middleware/auth.ts`, `apps/api/src/middleware/rateLimiter.ts`, `apps/api/src/services/fcmService.ts`

**Interfaces:**
- Consumes: `apiKeyAuth` (middleware/auth), `rateLimiter` (middleware/rateLimiter), `HealthResponse` (`@repo/shared`).
- Produces: Worker Hono avec `GET /health` (public) et `GET /example` (protégé par `rateLimiter` + `apiKeyAuth`). `Env` = `API_RATE_LIMITER`, `API_KEY`, `FIREBASE_*`. Plus de `scheduled`/cron.

- [ ] **Step 1: Supprimer les fichiers métier de l'API**

```bash
cd /home/colotcholoman/project/rn-starter
git rm apps/api/src/services/exchangeRate.ts apps/api/src/services/historicalRates.ts \
       apps/api/src/routes/rates.ts apps/api/src/routes/history.ts apps/api/src/routes/alerts.ts \
       apps/api/src/handlers/cron.ts \
       apps/api/src/utils/supportedCurrencies.ts apps/api/src/utils/alertNormalize.ts
```

- [ ] **Step 2: Créer une route protégée d'exemple**

Créer `apps/api/src/routes/example.ts` :

```ts
import { Hono } from 'hono'
import type { Env } from '../types'

export const example = new Hono<{ Bindings: Env }>()

// Route protégée d'exemple : illustre le pattern routes/handlers.
// L'authentification et le rate-limit sont appliqués dans index.ts.
example.get('/', (c) => c.json({ message: 'authenticated', at: Date.now() }))
```

- [ ] **Step 3: Réécrire `index.ts`**

Écraser `apps/api/src/index.ts` avec :

```ts
import { Hono } from 'hono'
import type { HealthResponse } from '@repo/shared/types/api'
import { apiKeyAuth } from './middleware/auth'
import { rateLimiter } from './middleware/rateLimiter'
import { example } from './routes/example'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.onError((err, c) => {
  if (err instanceof SyntaxError) {
    return c.json({ error: 'invalid_json' }, 400)
  }
  console.error(err)
  return c.json({ error: 'Internal error' }, 500)
})

app.get('/health', (c) =>
  c.json<HealthResponse>({ status: 'ok', timestamp: Date.now() }),
)

app.use('/example/*', rateLimiter)
app.use('/example/*', apiKeyAuth)
app.route('/example', example)

app.get('/', (c) => c.json({ status: 'ok' }))

export { app }

export default {
  fetch: app.fetch,
}
```

- [ ] **Step 4: Réécrire `types.ts`**

Écraser `apps/api/src/types.ts` avec :

```ts
export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export interface Env {
  API_RATE_LIMITER: RateLimiterBinding
  API_KEY: string
  FIREBASE_PRIVATE_KEY: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PROJECT_ID: string
}
```

- [ ] **Step 5: Nettoyer `wrangler.toml`**

Retirer les bindings devenus inutiles s'ils figurent : KV `RATE_CACHE`, KV `ALERTS_KV`, vars `EXCHANGE_RATE_API_KEY` / `CACHE_TTL_SECONDS`, et tout bloc `[triggers]` / `crons`. Conserver `API_RATE_LIMITER` et la config de déploiement (name, compatibility_date, etc.). Si `name` contient l'identité de l'app, le passer en placeholder (`rn-starter-api`).

- [ ] **Step 6: Vérifier l'absence d'import orphelin**

Run: `rg -n 'exchangeRate|historicalRates|alertNormalize|supportedCurrencies|handleCron|routes/rates|routes/history|routes/alerts' apps/api/src`
Expected: aucun résultat.

- [ ] **Step 7: Checkpoint**

Run: `pnpm --filter api typecheck && pnpm --filter api build`
Expected: typecheck PASS ; `wrangler deploy --dry-run` PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: reduce api to generic health and protected example routes"
```

---

### Task 4: Découplage premium — généraliser « N conversions » en compteur d'actions

**Contexte précis (vérifié dans le code) :** `services/storage/domains/conversion.ts` (`conversionStorage`) mélange (a) un compteur de conversions réussies — métier — exposé via `getTotalSuccessful()` / `incrementSuccessful()`, et (b) l'état de cadence des interstitiels — générique — exposé via `getAdExecutionCount()` / `getAdLastShown()` / `setAdExecutionCount()` / `setAdLastShown()`. Trois consommateurs **génériques** en dépendent :
- `services/api/contextualPaywall/index.ts` : `totalConversions: conversionStorage.getTotalSuccessful()` (trigger `after_n_conversions`).
- `services/api/adService.ts` : lit/écrit la cadence pub (`getAdExecutionCount` / `setAdExecutionCount` / `getAdLastShown` / `setAdLastShown`).
- `hooks/useConverterRating.ts` : `conversionStorage.incrementSuccessful()` + `getAdLastShown()`.

**Files:**
- Modify: `apps/mobile/services/storage/domains/engagement.ts` (ajouter le compteur d'actions générique)
- Create: `apps/mobile/services/storage/domains/ads.ts` (cadence interstitiels générique, extraite de `conversion.ts`)
- Modify: `apps/mobile/services/api/adService.ts` (pointer vers `adsStorage`)
- Modify: `apps/mobile/services/api/contextualPaywall/index.ts` (trigger sur le compteur d'actions)
- Create: `apps/mobile/hooks/useActionRating.ts` ; Delete: `apps/mobile/hooks/useConverterRating.ts`
- Modify: les consommateurs de `useConverterRating` (les repérer au Step 1)

**Interfaces:**
- Produces:
  - `engagementStorage.getActionCount(): number`, `engagementStorage.incrementAction(): number` (retourne le nouveau total), `engagementStorage.resetActionCount(): void`.
  - `adsStorage.getAdExecutionCount()`, `getAdLastShown()`, `setAdExecutionCount(n: number)`, `setAdLastShown(ts: number)` (signatures identiques à celles retirées de `conversionStorage`).
  - `useActionRating()` : même contrat que `useConverterRating` mais déclenché par le compteur d'actions, sans aucune notion de conversion.
  - Le trigger `contextualPaywall` est renommé `after_n_actions` et lit `engagementStorage.getActionCount()`.

- [ ] **Step 1: Cartographier les consommateurs avant de toucher**

Run:
```bash
cd /home/colotcholoman/project/rn-starter
rg -n 'useConverterRating' apps/mobile
rg -n 'getAdExecutionCount|getAdLastShown|setAdExecutionCount|setAdLastShown|getTotalSuccessful|incrementSuccessful|after_n_conversions|totalConversions' apps/mobile
```
Noter chaque emplacement. Inspecter `domains/engagement.ts` et `domains/conversion.ts` pour connaître les clés MMKV (`KEYS`) réellement utilisées.

- [ ] **Step 2: Étendre `engagementStorage` avec le compteur d'actions**

Dans `services/storage/domains/engagement.ts`, ajouter `getActionCount()`, `incrementAction()` (retourne le nouveau total), `resetActionCount()`, persistés via la même mécanique MMKV/`KEYS` que le reste du domain. Ajouter la clé nécessaire dans `services/storage/keys.ts` (ex. `ENGAGEMENT_ACTION_COUNT`).

- [ ] **Step 3: Extraire la cadence interstitiels dans `adsStorage`**

Créer `services/storage/domains/ads.ts` exposant `getAdExecutionCount` / `getAdLastShown` / `setAdExecutionCount` / `setAdLastShown` avec la même implémentation (mêmes clés `KEYS`) que celle actuellement dans `conversion.ts`. Ne pas changer le comportement, seulement l'emplacement (domaine générique).

- [ ] **Step 4: Rebrancher `adService.ts`**

Remplacer dans `services/api/adService.ts` l'import `conversionStorage` par `adsStorage` (`@/services/storage/domains/ads`) et les appels correspondants. Aucun changement de logique.

- [ ] **Step 5: Généraliser le paywall contextuel**

Dans `services/api/contextualPaywall/index.ts`, remplacer `conversionStorage.getTotalSuccessful()` par `engagementStorage.getActionCount()` et renommer le trigger `after_n_conversions` → `after_n_actions` (et le champ `totalConversions` → `totalActions`). Mettre à jour les types/énumérations du module en conséquence.

- [ ] **Step 6: Remplacer `useConverterRating` par `useActionRating`**

Créer `hooks/useActionRating.ts` : copie de `useConverterRating` où `conversionStorage.incrementSuccessful()` devient `engagementStorage.incrementAction()` et `conversionStorage.getAdLastShown()` devient `adsStorage.getAdLastShown()`. Renommer l'export. Supprimer `hooks/useConverterRating.ts` (`git rm`) et mettre à jour ses importateurs repérés au Step 1 (ils seront supprimés en Task 5 s'ils sont métier — dans ce cas, ne pas les recâbler, laisser Task 5 les supprimer ; sinon recâbler vers `useActionRating`).

- [ ] **Step 7: Retirer de `conversionStorage` la partie cadence pub**

Dans `domains/conversion.ts`, supprimer les méthodes `getAdExecutionCount` / `getAdLastShown` / `setAdExecutionCount` / `setAdLastShown` (désormais dans `adsStorage`). `conversionStorage` ne garde que le compteur de conversions métier — il sera supprimé entièrement en Task 5.

- [ ] **Step 8: Checkpoint partiel**

Run: `pnpm --filter mobile typecheck 2>&1 | rg -i 'adService|contextualPaywall|engagement|ads\.ts|useActionRating'`
Expected: aucune erreur sur ces fichiers. (Des erreurs peuvent subsister ailleurs si des modules métier importaient encore `useConverterRating`/`conversionStorage` — elles seront résolues par leur suppression en Task 5.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: generalize premium triggers from conversions to a generic action counter"
```

---

### Task 5: Purge des modules purement métier dans `apps/mobile`

**Files:**
- Delete (components): `apps/mobile/components/conversion/`, `currency/`, `calculator/`, `charts/`, `statistics/`, `export/`, `widget/`
- Delete (stores): `currencyStore.ts`, `quickConversionsStore.ts`, `statisticsStore.ts`, `exportPreferencesStore.ts`, `widgetStore.ts`, `widgetSheetStore.ts`, `backupStore.ts`, `backupTrigger.ts`
- Delete (services): `services/api/historicalRatesService.ts`, `exportService.ts`, `googleDriveBackupService.ts`, `googleDriveBackupProvider.ts`, `activeBackupProvider.ts`, `googleAuthService.ts` (utilisé uniquement par `backupStore`), `services/widget/`
- Delete (storage domains métier): `services/storage/domains/conversion.ts`, `rates.ts`, `widget.ts`, `backup.ts`
- Delete (module/bootstrap): `apps/mobile/modules/widget-watchlist/`, `components/layout/BackupBootstrap.tsx`
- Delete (route): `apps/mobile/app/statistics.tsx`
- Keep (généralisés Task 6): `stores/alertsStore.ts`, `services/notifications/`, `components/alerts/`, `providers/AlertNotificationProvider.tsx`, `stores/deepLinkStore.ts`

**Interfaces:**
- Consumes: la généralisation de Task 4 (les services génériques ne dépendent plus des domains métier).
- Produces: arborescence sans conversion/statistiques/export/backup/widget. `_layout.tsx` et `settings.tsx` auront des imports cassés — réparés Tasks 7 et 8 ; le typecheck mobile **complet** n'est exigé qu'après Task 8.

- [ ] **Step 1: Vérifier que les domains métier ne sont plus importés par du générique**

Run:
```bash
cd /home/colotcholoman/project/rn-starter
rg -n 'domains/(conversion|rates|widget|backup)|conversionStorage|ratesStorage|widgetStorage|backupStorage' apps/mobile \
  | rg -v 'components/(conversion|currency|calculator|charts|statistics|export|widget)|/(currencyStore|quickConversionsStore|statisticsStore|widgetStore|backupStore|historicalRatesService|exportService)\.|app/(index|statistics)\.tsx|services/storage/domains/(conversion|rates|widget|backup)\.ts'
```
Expected: aucune ligne. Si une ligne pointe un fichier **générique** non listé pour suppression, NE PAS supprimer le domain : remonter au contrôleur (couplage non découplé en Task 4).

- [ ] **Step 2: Supprimer les components métier**

```bash
git rm -r apps/mobile/components/conversion apps/mobile/components/currency \
         apps/mobile/components/calculator apps/mobile/components/charts \
         apps/mobile/components/statistics apps/mobile/components/export \
         apps/mobile/components/widget
```

- [ ] **Step 3: Supprimer les stores métier (garder alertsStore, deepLinkStore)**

```bash
git rm apps/mobile/stores/currencyStore.ts apps/mobile/stores/quickConversionsStore.ts \
       apps/mobile/stores/statisticsStore.ts apps/mobile/stores/exportPreferencesStore.ts \
       apps/mobile/stores/widgetStore.ts apps/mobile/stores/widgetSheetStore.ts \
       apps/mobile/stores/backupStore.ts apps/mobile/stores/backupTrigger.ts
```

- [ ] **Step 4: Supprimer les services métier + backup + widget + domains métier**

```bash
git rm apps/mobile/services/api/historicalRatesService.ts \
       apps/mobile/services/api/exportService.ts \
       apps/mobile/services/api/googleDriveBackupService.ts \
       apps/mobile/services/api/googleDriveBackupProvider.ts \
       apps/mobile/services/api/activeBackupProvider.ts \
       apps/mobile/services/api/googleAuthService.ts
git rm -r apps/mobile/services/widget
git rm apps/mobile/services/storage/domains/conversion.ts \
       apps/mobile/services/storage/domains/rates.ts \
       apps/mobile/services/storage/domains/widget.ts \
       apps/mobile/services/storage/domains/backup.ts
```

- [ ] **Step 5: Supprimer le module natif widget, le bootstrap backup et la route statistics**

```bash
git rm -r apps/mobile/modules/widget-watchlist
git rm apps/mobile/components/layout/BackupBootstrap.tsx
git rm apps/mobile/app/statistics.tsx
```

- [ ] **Step 6: Lister les références orphelines restantes (réparées Tasks 6–8)**

Run:
```bash
rg -n 'currencyStore|quickConversionsStore|statisticsStore|exportPreferencesStore|widgetStore|widgetSheetStore|backupStore|backupTrigger|BackupBootstrap|widget-watchlist|googleDriveBackup|activeBackupProvider|googleAuthService|historicalRatesService|exportService|domains/(conversion|rates|widget|backup)|components/(conversion|currency|calculator|charts|statistics|export|widget)' apps/mobile
```
Expected: résultats uniquement dans `app/_layout.tsx`, `app/settings.tsx`, et éventuellement `components/alerts/` (traité Task 6). Tout autre fichier générique encore couplé → remonter au contrôleur.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove conversion, statistics, export, backup and widget features from mobile"
```

---

### Task 6: Généralisation des alertes (rappels programmés locaux)

**Files:**
- Modify: `apps/mobile/stores/alertsStore.ts`
- Modify: `apps/mobile/providers/AlertNotificationProvider.tsx`
- Modify: `apps/mobile/services/notifications/scheduleAlert.ts` (et les autres fichiers `services/notifications/` qui référencent les taux)
- Modify: `apps/mobile/components/alerts/` (composants restants)
- Modify: `apps/mobile/services/storage/domains/alerts.ts` (si présent — adapter au modèle générique)
- Delete (si présent): `apps/mobile/services/api/alertsService.ts` (sync backend des alertes de prix)

**Interfaces:**
- Consumes: `services/notifications` (setup/channels/payload), `alertsStore`, `deepLinkStore`.
- Produces: un système de **rappels programmés** générique. Modèle remplaçant les types liés aux taux :
  ```ts
  export interface ScheduledAlert {
    id: string
    title: string
    body: string
    scheduledAt: number // timestamp unix (ms)
    isActive: boolean
  }
  ```

- [ ] **Step 1: Repérer le couplage taux dans les alertes**

Run:
```bash
cd /home/colotcholoman/project/rn-starter
rg -n 'currency|fromCurrency|toCurrency|targetRate|triggerType|variationPercent|RateAlert|rate' \
   apps/mobile/stores/alertsStore.ts apps/mobile/services/notifications apps/mobile/components/alerts \
   apps/mobile/providers/AlertNotificationProvider.tsx apps/mobile/services/storage/domains/alerts.ts 2>/dev/null
```

- [ ] **Step 2: Supprimer le service backend d'alertes (couplé à l'API de taux)**

```bash
test -f apps/mobile/services/api/alertsService.ts && git rm apps/mobile/services/api/alertsService.ts || echo "absent"
```

- [ ] **Step 3: Réécrire le modèle de `alertsStore.ts`**

Adopter `ScheduledAlert`. Adapter les actions (`add`, `remove`, `toggle`, `list`) ; retirer toute logique de seuil/direction/variation et toute synchronisation backend. Conserver la persistance MMKV.

- [ ] **Step 4: Découpler `scheduleAlert.ts` (et le reste de `services/notifications/`)**

Programmer une notification locale à partir d'un `ScheduledAlert` (`title`, `body`, `scheduledAt`) via le `notificationService` générique. Retirer toute référence aux taux dans `payload.ts` / `backgroundHandler.ts` si présente.

- [ ] **Step 5: Adapter `AlertNotificationProvider.tsx` et `components/alerts/`**

Retirer les sélecteurs de paires / seuils de taux. Les écrans/sheets présentent : titre, message, date/heure de programmation, activation. Conserver l'UX premium (design system, sheets existants).

- [ ] **Step 6: Vérifier l'absence de référence au domaine taux**

Run:
```bash
rg -n 'currency|fromCurrency|toCurrency|targetRate|triggerType|variationPercent|RateAlert' \
   apps/mobile/stores/alertsStore.ts apps/mobile/services/notifications apps/mobile/components/alerts \
   apps/mobile/providers/AlertNotificationProvider.tsx
```
Expected: aucun résultat.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: generalize alerts into scheduled local reminders"
```

---

### Task 7: `_layout.tsx` + écran d'accueil démo premium + onboarding générique

**Files:**
- Modify (réécriture ciblée): `apps/mobile/app/_layout.tsx`
- Modify (réécriture complète): `apps/mobile/app/index.tsx`
- Modify (généralisation): `apps/mobile/components/onboarding/OnboardingScreen.tsx` (et ses sous-composants si couplés aux devises)

**Interfaces:**
- Consumes: providers conservés (`QueryProvider`, `ThemeProvider`, `ToastProvider`, `SubscriptionProvider`, `AdFreeProvider`, `AlertNotificationProvider`), effets conservés (`TelemetryEffects`, `runStorageMigration`, `RTLRestartBanner`), `PremiumTabBar`, `useThemeColor`, design system `components/ui`, i18n.
- Produces: navigation à **2 onglets** (`index`, `settings`) ; un home **premium** bâti sur le design system ; un onboarding générique.

**Note onboarding (découvert en Task 5) :** `OnboardingScreen.tsx` est aujourd'hui un **onboarding de sélection de devise** (`selectedCurrency`, `defaultCurrencyFrom`, `addQuickCurrency` depuis le supprimé `quickConversionsStore`, currency picker). Le généraliser : retirer la sélection de devise et le couplage `quickConversionsStore`, conserver le carrousel/slides + la sélection de **langue** (générique) + le flux premium/onboarding completed. Garder l'UX premium (animations, design system). Aucune référence devise.

- [ ] **Step 1: Nettoyer `_layout.tsx` du métier**

Retirer imports + usages : `BackupBootstrap`, `WidgetSettingsSheet`, `useCurrencyStore`, `useExportPreferencesStore`, `useQuickConversionsStore`, et tout effet d'init/hydratation lié (currency/export/quickConversions/widget/backup). Réduire le `Tabs` à deux écrans :

```tsx
<Tabs
  tabBar={(props) => <PremiumTabBar {...props} />}
  screenOptions={{
    headerShown: false,
    sceneStyle: { backgroundColor: colors.screenBackground },
  }}>
  <Tabs.Screen name="index" />
  <Tabs.Screen name="settings" options={{ lazy: true }} />
</Tabs>
```

Conserver l'ordre du provider tree (storage migration → Telemetry → GestureHandlerRootView → QueryProvider → ThemeProvider → ToastProvider → SubscriptionProvider → AdFreeProvider → AlertNotificationProvider → contenu) et `RTLRestartBanner`.

- [ ] **Step 2: Inspecter le design system disponible**

Run: `ls apps/mobile/components/ui && rg -n 'export ' apps/mobile/components/ui/*.tsx | rg -i 'Screen|Text|Card|Button|GradientButton|Badge' | head -40`
Repérer les composants et leurs props réelles (Screen/Header, Text, Card, GradientButton…). **Utiliser ces composants** ; ne pas styler des primitives à la main.

- [ ] **Step 3: Écrire le home démo premium**

Réécrire `apps/mobile/app/index.tsx` : un écran d'accueil soigné qui présente le starter, **construit avec le design system** (conteneur `Screen`/layout existant, `Text` tokenisé, une à deux `Card`, un `GradientButton` de CTA), animations d'entrée légères (Moti/Reanimated, déjà dans les deps), respect du thème clair/sombre et du RTL. Toutes les chaînes via i18n (`useTranslation`) avec des clés sous `home.*` (valeurs EN + FR fournies en Task 8). Aucune référence métier.

- [ ] **Step 4: Checkpoint typecheck (settings encore cassé, attendu)**

Run: `pnpm --filter mobile typecheck 2>&1 | rg -v 'app/settings\.tsx'`
Expected: aucune erreur hors `app/settings.tsx`. Corriger tout import orphelin résiduel ici.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add premium demo home screen and reduce navigation to two tabs"
```

---

### Task 8: `settings` premium + nettoyage i18n (20 langues)

**Files:**
- Modify: `apps/mobile/app/settings.tsx`
- Delete: `apps/mobile/components/settings/BackupSection.tsx`, `QuickCurrencyList.tsx`
- Keep: `DisplaySection.tsx`, `LegalSupportSection.tsx`, `PremiumBanner.tsx`, `SubscriptionGraceBanner.tsx`, `SettingsSection.tsx`, `AlertsSettingsSection.tsx`, `QuietHoursSheet.tsx`
- Modify: `apps/mobile/i18n/languages/*.json` (**20 fichiers** : ar, bn, de, en, es, fr, hi, id, it, ja, ko, nl, pl, pt-BR, ru, sv, tr, vi, zh-CN, zh-TW)

**Interfaces:**
- Consumes: sections settings conservées, `useTranslation`.
- Produces: Settings premium générique (thème, langue, premium/paywall, rewarded ad, alertes, rating, version, liens légaux), sans backup ni devises ; clés i18n purgées du métier et complétées pour le home.

- [ ] **Step 1: Supprimer les sections settings métier**

```bash
cd /home/colotcholoman/project/rn-starter
git rm apps/mobile/components/settings/BackupSection.tsx \
       apps/mobile/components/settings/QuickCurrencyList.tsx
```

- [ ] **Step 2: Élaguer `app/settings.tsx`**

Retirer imports + rendu de `BackupSection` et `QuickCurrencyList` ; retirer tout handler référençant un store supprimé. Conserver l'ordre, le style premium et les sections restantes. Si `LegalSupportSection` importe un domain supprimé (cf. Task 5), recâbler vers une source générique (ex. version d'app via `expo-constants`).

- [ ] **Step 3: Repérer puis purger les clés i18n métier (20 langues)**

Run: `rg -n '"(conversion|converter|currency|currencies|statistics|export|backup|widget|rates?)"\s*:' apps/mobile/i18n/languages`
Dans **chaque** fichier `i18n/languages/*.json`, supprimer ces blocs métier. Ajouter les clés `home.*` utilisées en Task 7. **Politique de traduction (du CLAUDE.md source) :** fournir des valeurs réelles pour **EN et FR uniquement** (source de vérité) ; pour les 18 autres langues, retirer les clés métier et, pour les nouvelles clés `home.*`, soit reprendre l'anglais en fallback, soit laisser i18next retomber sur la langue par défaut — ne pas inventer de traductions mécaniques.

- [ ] **Step 4: Checkpoint complet mobile**

Run: `pnpm --filter mobile typecheck && pnpm --filter mobile lint`
Expected: typecheck PASS, lint PASS (0 erreur ESLint/prettier). Vérifier aussi que chaque JSON reste valide.

- [ ] **Step 5: Vérification finale « zéro métier » (code applicatif)**

Run: `rg -in 'currency|conversion|exchange[_ ]?rate' apps/mobile --glob '!node_modules' --glob '!ios/**' --glob '!android/**'`
Expected: aucun résultat. (Les dossiers natifs `ios/`/`android/` portent encore l'identité — traités Task 9.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: trim settings to generic sections and clean i18n keys"
```

---

### Task 9: Outillage template + neutralisation identité & secrets

**Files:**
- Create: `scripts/setup.sh` (repris/adapté de `rn-starter-app/scripts/setup.sh`)
- Modify (réécriture): `README.md`, `CLAUDE.md`
- Replace: `apps/mobile/PROJECT_CONTEXT.md` (40 Ko décrivant l'app conversion → version template concise, ou suppression si redondante avec CLAUDE.md)
- Modify: `apps/mobile/app.config.js`, `apps/mobile/services/storage/mmkv.ts` (id), `apps/mobile/package.json` (script `build:install`)
- Create: `apps/mobile/google-services.json.example`, `apps/api/.dev.vars.example`
- Modify: `apps/mobile/.env.example`
- Modify: dossiers natifs `apps/mobile/ios/` (renommer le projet `allcurencyconverter`) et bundle ids — ou documenter une régénération via `expo prebuild`.

**Interfaces:**
- Produces: dépôt clonable sans secret ni identité de l'app source, configurable via `scripts/setup.sh`.

- [ ] **Step 1: Reprendre l'outillage starter existant**

```bash
cd /home/colotcholoman/project/rn-starter
cp /home/colotcholoman/project/rn-starter-app/scripts/setup.sh scripts/setup.sh 2>/dev/null || true
cp /home/colotcholoman/project/rn-starter-app/apps/mobile/.env.example apps/mobile/.env.example 2>/dev/null || true
```
Lire ces fichiers et les adapter au monorepo **avec API** (le starter récupéré était mobile-only).

- [ ] **Step 2: Réécrire `README.md` et `CLAUDE.md`**

Réécrire entièrement pour décrire le boilerplate `rn-starter` (stack, structure `apps/api` + `apps/mobile` + `packages/shared`, commandes `pnpm dev/typecheck/lint`, `/health`, `wrangler dev`, déclencheurs premium via compteur d'actions, politique i18n EN/FR). **Aucune** mention de conversion de devises. Garder la directive « No tests ».

- [ ] **Step 3: Traiter `PROJECT_CONTEXT.md`**

Remplacer le contenu métier par une description concise du template, ou le supprimer si CLAUDE.md suffit (et retirer alors sa mention dans CLAUDE.md « Living Documentation »).

- [ ] **Step 4: Généraliser l'identité applicative**

- `apps/mobile/services/storage/mmkv.ts` : `id: 'all-currency-converter'` → `id: 'rn-starter'`.
- `apps/mobile/app.config.js` : nom, `slug`, bundle ids (`com.codeurdivoire.allcurencyconverter`), EAS `projectId`, schémas de deep link → placeholders (`rn-starter`, `com.yourcompany.yourapp`) ou lecture depuis `process.env` renseigné par `setup.sh`.
- `apps/mobile/package.json` : réécrire le script `build:install` sans chemin absolu ni bundle id de l'app source (utiliser un chemin relatif et un placeholder, ou retirer ce script).

- [ ] **Step 5: Gabarits de secrets**

Créer `apps/api/.dev.vars.example` (clés vides documentées) et `apps/mobile/google-services.json.example` (gabarit Firebase minimal). Documenter dans le README qu'il faut fournir les vrais fichiers (déjà gitignorés).

- [ ] **Step 6: Checkpoint clone simulé**

Run:
```bash
rg -in 'allcurency|all-currency|codeurdivoire|converter|devise|exchange' README.md CLAUDE.md apps/mobile/app.config.js apps/mobile/services/storage/mmkv.ts apps/mobile/package.json apps/mobile/PROJECT_CONTEXT.md 2>/dev/null
```
Expected: aucun résidu d'identité/métier. Puis `pnpm typecheck && pnpm --filter mobile lint` PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add template tooling and scrub app identity and secrets"
```

---

### Task 10: Archivage de l'ancien starter

**Files:**
- Delete: `/home/colotcholoman/project/rn-starter-app/`, `/home/colotcholoman/project/premium-rn-starter-copie/`

**Interfaces:**
- Consumes: `rn-starter` validé (Tasks 1–9 vertes + revue finale).

- [ ] **Step 1: Confirmation explicite de l'utilisateur**

**NE PAS exécuter sans un « oui » explicite.** Vérifier d'abord que tout ce qui devait être récupéré de `rn-starter-app` (Task 9) l'a bien été.

- [ ] **Step 2: Supprimer les anciens dossiers**

```bash
rm -rf /home/colotcholoman/project/rn-starter-app /home/colotcholoman/project/premium-rn-starter-copie
```

- [ ] **Step 3: Tag de version initiale**

```bash
cd /home/colotcholoman/project/rn-starter
git tag v0.1.0 -m "Initial rn-starter boilerplate"
```

---

### Task 11: Généraliser le système analytics et le contexte de rating

**À exécuter APRÈS la purge (Task 5) et les alertes (Task 6)** : la purge supprime la majorité des émetteurs d'événements métier ; ne restent que les usages génériques. Checkpoint *scoped* uniquement (le typecheck complet vient en Task 8).

**Contexte précis :** `services/api/analyticsService.ts` définit `AnalyticsEventMap`, un catalogue typé d'événements Firebase Analytics (`track<K extends keyof AnalyticsEventMap>`). Il contient des événements métier — `conversion_performed` (avec `from_currency` / `to_currency` / `total_conversions`), `conversion_count`, etc. — que des fichiers génériques conservés référencent encore (`hooks/useActionRating.ts`, `hooks/useAppRating.ts` via `CheckRatingContext.totalSuccessfulConversions`, éventuellement `components/settings/LegalSupportSection.tsx`).

**Files:**
- Modify: `apps/mobile/services/api/analyticsService.ts` (`AnalyticsEventMap`)
- Modify: `apps/mobile/hooks/useActionRating.ts`
- Modify: `apps/mobile/hooks/useAppRating.ts` (`CheckRatingContext`)
- Modify: tout consommateur générique encore présent (repéré au Step 1)

**Interfaces:**
- Produces: `AnalyticsEventMap` générique — uniquement les événements réellement émis après purge (premium/paywall/ads/rating/onboarding/settings) plus un `action_performed: { total_actions: number }`. `CheckRatingContext` sans champ lié à la conversion (`totalSuccessfulConversions` → `totalActions`).

- [ ] **Step 1: Inventaire post-purge des événements émis**

Run:
```bash
cd /home/colotcholoman/project/rn-starter
rg -n 'analyticsService\.track\(|\btrack<|track\(' apps/mobile --glob '!node_modules'
rg -n 'CheckRatingContext|totalSuccessfulConversions' apps/mobile
```
Lister les clés d'événements réellement référencées (YAGNI : ne garder que celles-là).

- [ ] **Step 2: Réécrire `AnalyticsEventMap`**

Garder/renommer les événements **génériques** émis ; remplacer les événements métier par `action_performed: { total_actions: number }` (et tout autre event générique encore référencé). Retirer `from_currency`/`to_currency`/`total_conversions`/`conversion_count`. **Retirer aussi les 5 types d'événements widget morts** laissés par la Task 5 (`widget_added`, `widget_removed`, `widget_pair_tap`, `widget_refresh_success`, `widget_refresh_fail`) — leurs émetteurs ont été supprimés. Aucun event non émis ne subsiste.

- [ ] **Step 3: Mettre à jour `useActionRating.ts`**

`analyticsService.track('action_performed', { total_actions: newTotal })` (remplace `'conversion_performed'` / `total_conversions`).

- [ ] **Step 4: Généraliser `CheckRatingContext` (`useAppRating.ts`)**

`totalSuccessfulConversions` → `totalActions` ; mettre à jour la logique et les appelants restants (ex. `useActionRating`).

- [ ] **Step 5: Checkpoint scoped**

Run: `pnpm --filter mobile typecheck 2>&1 | rg -i 'analyticsService|useActionRating|useAppRating|LegalSupport'`
Expected: aucune erreur sur ces fichiers. (Des erreurs ailleurs restent possibles tant que `_layout`/`settings` ne sont pas réparés — normal.)

- [ ] **Step 6: Vérif sémantique**

Run: `rg -in 'currency|conversion|exchange|from_currency|to_currency|total_conversions|conversion_count' apps/mobile/services/api/analyticsService.ts apps/mobile/hooks`
Expected: aucun résultat. (Le sous-système *rating* « rate app » reste autorisé.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: generalize analytics event map and rating context"
```

---

## Self-Review

**Spec coverage:**
- Stratégie soustractive → Tasks 1–9 ✅
- Monorepo complet, API généralisée minimale → Tasks 2, 3 ✅
- Métier infiltré dans le générique (paywall/ads/rating) découplé → Task 4 ✅ (décision « compteur d'actions »)
- Frontière métier/générique (shared/api/mobile, domains) → Tasks 2–6 ✅
- Alertes généralisées, backup + export retirés → Tasks 5, 6 ✅
- Routes : home premium + settings complet + statistics supprimé → Tasks 7, 8 ✅
- i18n 20 langues, politique EN/FR → Task 8 ✅
- Outillage starter, identité & secrets (mmkv id, app.config, PROJECT_CONTEXT, CLAUDE.md) → Task 9 ✅
- Archivage sur confirmation → Task 10 ✅
- Critères de succès (typecheck/lint/build verts, zéro métier) → checkpoints Tasks 3, 7, 8, 9 ✅

**Placeholder scan:** Les tâches de découplage (4), d'écrans premium (7) et de réécriture doc (9) décrivent l'intention + signatures cibles + fichiers exacts, en laissant l'implémenteur inspecter l'API réelle du design system / des domains — instructions d'intégration, pas placeholders vagues. Les checkpoints typecheck/lint prouvent l'achèvement.

**Type consistency:** `HealthResponse`/`ApiErrorResponse` (Task 2) consommés en Task 3. `engagementStorage.getActionCount/incrementAction` + `adsStorage.*` + `useActionRating` (Task 4) consommés par les services génériques avant la purge (Task 5). `ScheduledAlert` (Task 6) remplace le modèle taux. Nav 2 onglets (Task 7) cohérente avec le retrait de `statistics` (Task 5).
