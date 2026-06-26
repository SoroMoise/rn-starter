# rn-starter Boilerplate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produire `rn-starter/`, un boilerplate Expo/monorepo, en copiant l'app de production `all-currency-converter` puis en retirant tout le métier « conversion de devises ».

**Architecture:** Opération **soustractive**. On part d'une base qui build déjà, et on retire/généralise couche par couche (`shared` → `api` → `mobile`). Comme le projet n'a **aucun test unitaire**, la « boucle rouge/vert » du TDD est remplacée par des **checkpoints de vérification** : `typecheck` + `lint` + `build` doivent être verts à la fin de chaque tâche. Les imports orphelins créés par les suppressions sont détectés par `typecheck` et corrigés dans la même tâche.

**Tech Stack:** Expo SDK 54 + Expo Router, React Native, NativeWind v4, Zustand v5, TanStack Query v5, i18next (9 langues), Firebase, AdMob, RevenueCat, Hono + Cloudflare Workers (api), pnpm 10 + Turborepo, TypeScript strict.

## Global Constraints

- Dossier cible : `/home/colotcholoman/project/rn-starter/` (créé à la Task 1, historique git neuf).
- Nom du package racine : `rn-starter`. Package partagé : `@repo/shared`.
- Ne **jamais** committer de secret/identité réels : `.env`, `.dev.vars`, `google-services.json`, `GoogleService-Info.plist`, `release.keystore`, `keystore.properties`, EAS project id, bundle ids. → placeholders.
- À conserver intact : patches (`expo-notifications`), `apps/mobile/plugins/`, config Turbo/pnpm/EAS.
- Zones grises tranchées : **alertes conservées** (généralisées, moteur de notifs local), **backup Google Drive retiré**, **export retiré**.
- Vérification de référence à la fin de chaque tâche mobile : `rg -n 'currency|conversion|exchange|rate' apps/mobile/<zone>` ne doit plus rien renvoyer dans le code traité (hors `node_modules`).
- Commits : messages en **anglais**, format **Conventional Commits** (`feat:`, `chore:`, `refactor:`, `docs:`…).
- `git mv`/suppressions via `git rm` pour garder l'index propre.

---

### Task 1: Bootstrap du dépôt `rn-starter`

**Files:**
- Create: `/home/colotcholoman/project/rn-starter/` (copie filtrée de `all-currency-converter`)
- Create: `rn-starter/docs/superpowers/specs/2026-06-26-rn-starter-boilerplate-design.md` (copie du spec)
- Modify: `rn-starter/package.json`, `rn-starter/apps/api/package.json`, `rn-starter/apps/mobile/package.json`, `rn-starter/packages/shared/package.json` (ajout script `typecheck`)

**Interfaces:**
- Produces: les commandes de checkpoint réutilisées par toutes les tâches suivantes :
  - `pnpm --filter @repo/shared build`
  - `pnpm --filter @repo/shared typecheck`
  - `pnpm --filter api typecheck` · `pnpm --filter api build`
  - `pnpm --filter mobile typecheck` · `pnpm --filter mobile lint`

- [ ] **Step 1: Copier l'app en excluant build/artefacts/git**

```bash
rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.turbo' \
  --exclude '.wrangler' \
  --exclude 'dist' \
  --exclude 'artifacts' \
  --exclude '.expo' \
  --exclude 'apps/mobile/.expo' \
  --exclude 'apps/mobile/android/build' \
  --exclude 'apps/mobile/android/app/build' \
  --exclude 'apps/mobile/android/.gradle' \
  --exclude 'apps/mobile/ios/Pods' \
  --exclude 'apps/mobile/ios/build' \
  --exclude 'apps/mobile/report.html' \
  /home/colotcholoman/project/all-currency-converter/ \
  /home/colotcholoman/project/rn-starter/
```

- [ ] **Step 2: Initialiser un dépôt git neuf**

```bash
cd /home/colotcholoman/project/rn-starter
git init
```

- [ ] **Step 3: Copier le spec dans le nouveau dépôt**

```bash
mkdir -p /home/colotcholoman/project/rn-starter/docs/superpowers/specs
cp /home/colotcholoman/project/docs/superpowers/specs/2026-06-26-rn-starter-boilerplate-design.md \
   /home/colotcholoman/project/rn-starter/docs/superpowers/specs/
```

- [ ] **Step 4: Ajouter un script `typecheck` à chaque package**

Dans `packages/shared/package.json`, `apps/api/package.json`, `apps/mobile/package.json`, ajouter au bloc `scripts` :

```json
"typecheck": "tsc --noEmit"
```

Dans `package.json` (racine), ajouter au bloc `scripts` :

```json
"typecheck": "turbo run typecheck"
```

Dans `turbo.json`, ajouter une tâche `typecheck` qui dépend du build des deps :

```json
"typecheck": { "dependsOn": ["^build"] }
```

- [ ] **Step 5: Installer les dépendances**

Run: `cd /home/colotcholoman/project/rn-starter && pnpm install`
Expected: installation OK, lockfile résolu.

- [ ] **Step 6: Checkpoint baseline — l'app copiée doit déjà être verte AVANT tout retrait**

Run: `pnpm --filter @repo/shared build && pnpm typecheck`
Expected: shared build OK ; typecheck `shared`, `api`, `mobile` PASS (état de référence). Si une erreur préexiste, la noter — elle n'est pas causée par le nettoyage.

- [ ] **Step 7: Commit initial**

```bash
cd /home/colotcholoman/project/rn-starter
git add -A
git commit -m "chore: bootstrap rn-starter from all-currency-converter snapshot"
```

---

### Task 2: Démétiérisation de `packages/shared`

**Files:**
- Modify (réécriture complète): `packages/shared/src/types/api.ts`
- Modify (réécriture complète): `packages/shared/src/index.ts`
- Delete: `packages/shared/src/constants/currencies.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `@repo/shared` exporte désormais `HealthResponse`, `ApiErrorResponse` (types génériques). Plus aucun export `ExchangeRateResponse`, `HistoricalRatesResponse`, `RateAlert`, `CURRENCY_LIST`, `CurrencyInfo`.

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

- [ ] **Step 4: Checkpoint**

Run: `pnpm --filter @repo/shared build && pnpm --filter @repo/shared typecheck`
Expected: build (tsup) + typecheck PASS.

- [ ] **Step 5: Commit**

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
- Keep: `apps/api/src/middleware/auth.ts`, `apps/api/src/middleware/rateLimiter.ts`, `apps/api/src/services/fcmService.ts`

**Interfaces:**
- Consumes: `apiKeyAuth` (middleware/auth), `rateLimiter` (middleware/rateLimiter), `HealthResponse` (`@repo/shared`).
- Produces: un Worker Hono avec `GET /health` (public) et `GET /example` (protégé par `apiKeyAuth` + `rateLimiter`). `Env` ne contient plus que `API_RATE_LIMITER`, `API_KEY`, `FIREBASE_*`.

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
import { apiKeyAuth } from './middleware/auth'
import { rateLimiter } from './middleware/rateLimiter'
import { example } from './routes/example'
import type { Env } from './types'
import type { HealthResponse } from '@repo/shared/types/api'

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

- [ ] **Step 4: Réécrire `types.ts` (retirer les bindings métier)**

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

- [ ] **Step 5: Nettoyer `wrangler.toml` des bindings métier**

Ouvrir `apps/api/wrangler.toml` et retirer les bindings devenus inutiles s'ils y figurent : KV `RATE_CACHE`, KV `ALERTS_KV`, var `EXCHANGE_RATE_API_KEY`, var `CACHE_TTL_SECONDS`, et tout bloc `[triggers]`/`crons` (le cron a été supprimé). Conserver le binding `API_RATE_LIMITER` et la config de déploiement.

- [ ] **Step 6: Vérifier qu'aucun import orphelin ne subsiste**

Run: `rg -n 'exchangeRate|historicalRates|alertNormalize|supportedCurrencies|handleCron|routes/rates|routes/history|routes/alerts' apps/api/src`
Expected: aucun résultat.

- [ ] **Step 7: Checkpoint**

Run: `pnpm --filter api typecheck && pnpm --filter api build`
Expected: typecheck PASS ; `wrangler deploy --dry-run` PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: reduce api to generic health + protected example routes"
```

---

### Task 4: Purge du métier dans `apps/mobile` (components / stores / services / module)

**Files:**
- Delete (components): `apps/mobile/components/conversion/`, `currency/`, `calculator/`, `charts/`, `statistics/`, `export/`, `widget/`
- Delete (stores): `apps/mobile/stores/currencyStore.ts`, `quickConversionsStore.ts`, `statisticsStore.ts`, `exportPreferencesStore.ts`, `widgetStore.ts`, `widgetSheetStore.ts`, `backupStore.ts`, `backupTrigger.ts`
- Delete (services): `apps/mobile/services/api/historicalRatesService.ts`, `exportService.ts`, `services/widget/`, `services/api/googleDriveBackupService.ts`, `googleDriveBackupProvider.ts`, `activeBackupProvider.ts`
- Delete (module/components/providers backup): `apps/mobile/modules/widget-watchlist/`, `apps/mobile/components/layout/BackupBootstrap.tsx`
- Delete (route): `apps/mobile/app/statistics.tsx`
- Keep (généralisé en Task 5): `apps/mobile/stores/alertsStore.ts`, `services/notifications/`, `components/alerts/`, `providers/AlertNotificationProvider.tsx`

**Interfaces:**
- Consumes: rien.
- Produces: arborescence mobile sans modules de conversion/statistiques/export/backup/widget. `_layout.tsx` et `settings.tsx` auront des imports cassés — réparés en Tasks 6 et 7 ; on ne lance donc le typecheck mobile **complet** qu'après la Task 7. Ici on vérifie seulement que les fichiers supprimés ne sont plus référencés par d'autres modules métier déjà supprimés.

- [ ] **Step 1: Supprimer les components métier**

```bash
cd /home/colotcholoman/project/rn-starter
git rm -r apps/mobile/components/conversion apps/mobile/components/currency \
         apps/mobile/components/calculator apps/mobile/components/charts \
         apps/mobile/components/statistics apps/mobile/components/export \
         apps/mobile/components/widget
```

- [ ] **Step 2: Supprimer les stores métier (hors alertsStore)**

```bash
git rm apps/mobile/stores/currencyStore.ts apps/mobile/stores/quickConversionsStore.ts \
       apps/mobile/stores/statisticsStore.ts apps/mobile/stores/exportPreferencesStore.ts \
       apps/mobile/stores/widgetStore.ts apps/mobile/stores/widgetSheetStore.ts \
       apps/mobile/stores/backupStore.ts apps/mobile/stores/backupTrigger.ts
```

- [ ] **Step 3: Supprimer les services métier + backup + export + widget**

```bash
git rm apps/mobile/services/api/historicalRatesService.ts \
       apps/mobile/services/api/exportService.ts \
       apps/mobile/services/api/googleDriveBackupService.ts \
       apps/mobile/services/api/googleDriveBackupProvider.ts \
       apps/mobile/services/api/activeBackupProvider.ts
git rm -r apps/mobile/services/widget
```

- [ ] **Step 4: Supprimer le module natif widget et le bootstrap de backup**

```bash
git rm -r apps/mobile/modules/widget-watchlist
git rm apps/mobile/components/layout/BackupBootstrap.tsx
```

- [ ] **Step 5: Supprimer la route statistics**

```bash
git rm apps/mobile/app/statistics.tsx
```

- [ ] **Step 6: Lister les références orphelines restantes (sera réparé en Tasks 5–7)**

Run: `rg -n 'currencyStore|quickConversionsStore|statisticsStore|exportPreferencesStore|widgetStore|widgetSheetStore|backupStore|backupTrigger|BackupBootstrap|widget-watchlist|googleDriveBackup|activeBackupProvider|historicalRatesService|exportService|components/(conversion|currency|calculator|charts|statistics|export|widget)' apps/mobile`
Expected: les seuls résultats doivent se trouver dans `apps/mobile/app/_layout.tsx`, `apps/mobile/app/settings.tsx` (réparés Tasks 6–7). Noter cette liste pour les tâches suivantes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove conversion, statistics, export, backup and widget features from mobile"
```

---

### Task 5: Généralisation des alertes (découplage du domaine « taux »)

**Files:**
- Modify: `apps/mobile/stores/alertsStore.ts`
- Modify: `apps/mobile/providers/AlertNotificationProvider.tsx`
- Modify: `apps/mobile/services/notifications/scheduleAlert.ts`
- Modify: `apps/mobile/components/alerts/` (composants restants)
- Delete (si présent, service backend de prix): `apps/mobile/services/api/alertsService.ts`

**Interfaces:**
- Consumes: `apps/mobile/services/notifications` (setup/channels/payload), `alertsStore`.
- Produces: un système d'« alertes/rappels programmés » générique. Les types et champs liés au taux (`fromCurrency`, `toCurrency`, `targetRate`, `triggerType`, `variationPercent`…) sont remplacés par un modèle générique : `{ id: string; title: string; body: string; scheduledAt: number; isActive: boolean }`.

- [ ] **Step 1: Supprimer le service d'alertes backend (couplé à l'API de taux)**

```bash
cd /home/colotcholoman/project/rn-starter
test -f apps/mobile/services/api/alertsService.ts && git rm apps/mobile/services/api/alertsService.ts || echo "absent, rien à faire"
```

- [ ] **Step 2: Réécrire le modèle de `alertsStore.ts`**

Remplacer la forme de l'alerte par le modèle générique. Le store expose :

```ts
export interface ScheduledAlert {
  id: string
  title: string
  body: string
  scheduledAt: number // timestamp unix (ms)
  isActive: boolean
}
```

Adapter les actions (`add`, `remove`, `toggle`, `list`) à ce modèle ; retirer toute logique de comparaison de taux / direction / seuil. Conserver la persistance MMKV existante.

- [ ] **Step 3: Découpler `scheduleAlert.ts`**

Adapter `services/notifications/scheduleAlert.ts` pour programmer une notification locale à partir d'un `ScheduledAlert` (`title`, `body`, `scheduledAt`), sans aucune référence aux taux. S'appuyer sur le `notificationService` générique déjà présent.

- [ ] **Step 4: Adapter `AlertNotificationProvider.tsx` et les composants `components/alerts/`**

Retirer du provider et des composants toute référence aux devises (sélecteurs de paires, seuils de taux). Les écrans/sheets d'alerte présentent désormais : titre, message, date/heure de programmation, activation.

- [ ] **Step 5: Vérifier l'absence de référence au domaine taux dans les alertes**

Run: `rg -n 'currency|fromCurrency|toCurrency|targetRate|triggerType|variationPercent|rate' apps/mobile/stores/alertsStore.ts apps/mobile/services/notifications apps/mobile/components/alerts apps/mobile/providers/AlertNotificationProvider.tsx`
Expected: aucun résultat.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: generalize alerts into scheduled local reminders"
```

---

### Task 6: `_layout.tsx` + home démo

**Files:**
- Modify (réécriture ciblée): `apps/mobile/app/_layout.tsx`
- Modify (réécriture complète): `apps/mobile/app/index.tsx`

**Interfaces:**
- Consumes: providers conservés (`QueryProvider`, `ThemeProvider`, `ToastProvider`, `SubscriptionProvider`, `AdFreeProvider`, `AlertNotificationProvider`), services conservés (analytics, crashlytics, ads, purchase, engagement, notifications, storage/migration), `useThemeColor` (`@/components/Themed`), i18n.
- Produces: navigation à **2 onglets** (`index`, `settings`) ; un écran d'accueil démo autonome.

- [ ] **Step 1: Retirer de `_layout.tsx` les imports/usages métier**

Dans `apps/mobile/app/_layout.tsx`, supprimer ces imports **et tous leurs usages** :

```
import { BackupBootstrap } from '@/components/layout/BackupBootstrap'
import { WidgetSettingsSheet } from '@/components/widget/WidgetSettingsSheet'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useExportPreferencesStore } from '@/stores/exportPreferencesStore'
import { useQuickConversionsStore } from '@/stores/quickConversionsStore'
```

Retirer le `<Tabs.Screen name="statistics" ... />` du `TabLayout`. Le bloc `Tabs` ne garde que `index` et `settings` :

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

Retirer tout effet d'initialisation (`useEffect`, hydratation de store) référençant les stores/composants supprimés (`BackupBootstrap`, currency/export/quickConversions/widget).

- [ ] **Step 2: Écrire l'écran d'accueil démo**

Écraser `apps/mobile/app/index.tsx` avec un home autonome (primitives RN + thème + i18n, sans dépendance à un composant ui dont l'API n'est pas vérifiée) :

```tsx
import { useThemeColor } from '@/components/Themed'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const colors = useThemeColor()
  const { t } = useTranslation()

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.screenBackground }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('home.title', 'Bienvenue')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted ?? colors.text }]}>
          {t('home.subtitle', 'Votre nouvelle app démarre ici.')}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card ?? colors.screenBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('home.card.title', 'Prêt à construire')}
          </Text>
          <Text style={[styles.cardBody, { color: colors.textMuted ?? colors.text }]}>
            {t(
              'home.card.body',
              'Thème, i18n, paywall, pubs et notifications sont déjà câblés.',
            )}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 16 },
  card: { marginTop: 16, padding: 16, borderRadius: 16, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardBody: { fontSize: 14, lineHeight: 20 },
})
```

> Note : si `useThemeColor()` n'expose pas `textMuted`/`card`, les `??` retombent sur des valeurs existantes — aucune clé inventée n'est requise. Le home pourra ensuite être enrichi avec les composants de `components/ui` une fois leurs props vérifiées.

- [ ] **Step 3: Checkpoint typecheck (partiel — settings encore cassé, attendu)**

Run: `pnpm --filter mobile typecheck 2>&1 | rg -v 'app/settings.tsx'`
Expected: aucune erreur **hors** `app/settings.tsx` (réparé en Task 7). Si une erreur subsiste ailleurs (import orphelin oublié), la corriger ici.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add demo home screen and reduce navigation to two tabs"
```

---

### Task 7: `settings` + nettoyage i18n

**Files:**
- Modify: `apps/mobile/app/settings.tsx`
- Delete: `apps/mobile/components/settings/BackupSection.tsx`, `apps/mobile/components/settings/QuickCurrencyList.tsx`
- Keep: `DisplaySection.tsx`, `LegalSupportSection.tsx`, `PremiumBanner.tsx`, `SubscriptionGraceBanner.tsx`, `SettingsSection.tsx`, `AlertsSettingsSection.tsx`, `QuietHoursSheet.tsx`
- Modify: `apps/mobile/i18n/languages/*.json` (9 fichiers)

**Interfaces:**
- Consumes: sections settings conservées, `useTranslation`.
- Produces: un écran Settings complet et générique (thème, langue, premium/paywall, rewarded ad, alertes, rating, version, liens légaux), sans backup ni devises.

- [ ] **Step 1: Supprimer les sections settings métier**

```bash
cd /home/colotcholoman/project/rn-starter
git rm apps/mobile/components/settings/BackupSection.tsx \
       apps/mobile/components/settings/QuickCurrencyList.tsx
```

- [ ] **Step 2: Élaguer `app/settings.tsx`**

Dans `apps/mobile/app/settings.tsx`, retirer les imports et le rendu de `BackupSection` et `QuickCurrencyList`. Conserver l'ordre et le rendu des sections restantes. Vérifier qu'aucun handler restant ne référence un store supprimé.

- [ ] **Step 3: Nettoyer les clés i18n métier dans les 9 langues**

Pour chaque fichier de `apps/mobile/i18n/languages/` (`en, fr, es, ru, ar, pl, nl, id, zh-TW`), retirer les blocs de clés liés au métier (conversion, currencies, statistics, export, backup, widget, alertes de taux) et ajouter les clés du home (`home.title`, `home.subtitle`, `home.card.title`, `home.card.body`). Repérer les blocs métier :

Run: `rg -n '"(conversion|currency|currencies|statistics|export|backup|widget)"' apps/mobile/i18n/languages`

Supprimer ces objets dans chaque fichier. Garder les clés génériques (settings, onboarding, paywall, common, alerts génériques).

- [ ] **Step 4: Checkpoint complet mobile**

Run: `pnpm --filter mobile typecheck && pnpm --filter mobile lint`
Expected: typecheck PASS, lint PASS (0 erreur ESLint/prettier).

- [ ] **Step 5: Vérification finale « zéro métier »**

Run: `rg -n -i 'currency|conversion|exchange[_ ]?rate' apps/mobile --glob '!node_modules'`
Expected: aucun résultat dans le code applicatif (ignorer d'éventuels résultats dans `ios/`/`android/` natifs, traités en Task 8).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: trim settings to generic sections and clean i18n keys"
```

---

### Task 8: Outillage template + neutralisation de l'identité/secrets

**Files:**
- Create: `scripts/setup.sh` (repris de `rn-starter-app/scripts/setup.sh`)
- Modify (réécriture): `README.md`, `CLAUDE.md` (repris/adaptés de `rn-starter-app`)
- Modify: `apps/mobile/app.config.js` (placeholders)
- Modify/Create: `apps/mobile/.env.example`
- Delete/placeholder: `apps/mobile/google-services.json`, `apps/mobile/GoogleService-Info.plist`, `apps/mobile/release.keystore`, `apps/mobile/keystore.properties`, `apps/api/.dev.vars`
- Modify: `.gitignore` (ignorer les secrets réels)

**Interfaces:**
- Consumes: rien.
- Produces: un dépôt clonable sans secret, configurable via `scripts/setup.sh`.

- [ ] **Step 1: Reprendre l'outillage starter déjà écrit**

```bash
cd /home/colotcholoman/project/rn-starter
cp /home/colotcholoman/project/rn-starter-app/scripts/setup.sh scripts/setup.sh 2>/dev/null || true
cp /home/colotcholoman/project/rn-starter-app/apps/mobile/.env.example apps/mobile/.env.example 2>/dev/null || true
cp /home/colotcholoman/project/rn-starter-app/README.md README.md 2>/dev/null || true
cp /home/colotcholoman/project/rn-starter-app/CLAUDE.md CLAUDE.md 2>/dev/null || true
```

Relire chacun et l'adapter au monorepo **avec API** (le starter récupéré était mobile-only) : documenter `apps/api`, `/health`, le `wrangler dev`, et la structure réelle.

- [ ] **Step 2: Neutraliser les fichiers de secrets/identité**

```bash
git rm --cached apps/mobile/google-services.json apps/mobile/GoogleService-Info.plist \
       apps/mobile/release.keystore apps/mobile/keystore.properties apps/api/.dev.vars 2>/dev/null || true
```

Créer des gabarits versionnés à la place : `apps/mobile/google-services.json.example`, `apps/api/.dev.vars.example` (avec clés vides), et documenter dans le README.

- [ ] **Step 3: Mettre des placeholders dans `app.config.js`**

Dans `apps/mobile/app.config.js`, remplacer le nom d'app, le `slug`, les bundle ids (`com.codeurdivoire.allcurencyconverter`…), l'EAS `projectId` et les schémas de deep link par des placeholders (`YOUR_APP_NAME`, `com.yourcompany.yourapp`, etc.), ou les lire depuis `process.env` renseigné par `setup.sh`.

- [ ] **Step 4: Mettre à jour `.gitignore`**

Ajouter (s'ils n'y sont pas) : `google-services.json`, `GoogleService-Info.plist`, `*.keystore`, `keystore.properties`, `.dev.vars`, `.env`.

- [ ] **Step 5: Checkpoint clone simulé**

Run:
```bash
rg -n -i 'allcurency|all-currency|codeurdivoire' apps/mobile/app.config.js README.md CLAUDE.md
```
Expected: aucun résidu d'identité de l'app source. Puis `pnpm typecheck` PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add template tooling and scrub app identity and secrets"
```

---

### Task 9: Archivage de l'ancien starter

**Files:**
- Delete: `/home/colotcholoman/project/rn-starter-app/`, `/home/colotcholoman/project/premium-rn-starter-copie/`

**Interfaces:**
- Consumes: rn-starter validé (Tasks 1–8 vertes).

- [ ] **Step 1: Confirmation explicite de l'utilisateur**

**NE PAS exécuter sans un « oui » explicite.** Vérifier au préalable que tout ce qui devait être récupéré de `rn-starter-app` (Task 8) l'a bien été.

- [ ] **Step 2: Supprimer les anciens dossiers**

```bash
rm -rf /home/colotcholoman/project/rn-starter-app /home/colotcholoman/project/premium-rn-starter-copie
```

- [ ] **Step 3: (Optionnel) tag de version initiale**

```bash
cd /home/colotcholoman/project/rn-starter
git tag v0.1.0 -m "Initial rn-starter boilerplate"
```

---

## Self-Review

**Spec coverage:**
- Stratégie soustractive → Tasks 1–8 ✅
- Périmètre monorepo complet, API généralisée minimale → Tasks 2, 3 ✅
- Destination nouveau dossier + git neuf → Task 1 ✅
- Frontière métier/générique (shared/api/mobile) → Tasks 2–5 ✅
- Alertes conservées généralisées, backup + export retirés → Tasks 4, 5 ✅
- Routes : home démo + settings complet + statistics supprimé → Tasks 6, 7 ✅
- Outillage starter récupéré → Task 8 ✅
- Secrets/identité neutralisés → Task 8 ✅
- Archivage sur confirmation → Task 9 ✅
- Critères de succès (typecheck/lint/build verts, zéro `currency`) → checkpoints Tasks 3, 6, 7 ✅

**Placeholder scan:** Les instructions « retirer les usages » dans `_layout.tsx`/`settings.tsx` sont bornées par des listes d'imports exacts + un checkpoint typecheck qui prouve l'achèvement — ce ne sont pas des placeholders vagues mais la nature du travail soustractif sur un fichier-hub non entièrement réécrit.

**Type consistency:** `HealthResponse`/`ApiErrorResponse` (Task 2) sont consommés en Task 3. `ScheduledAlert` (Task 5) remplace le modèle métier de façon cohérente. La navigation 2 onglets (Task 6) correspond au retrait de `statistics` (Task 4).
