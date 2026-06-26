# Design — `rn-starter` : boilerplate par démétiérisation d'`all-currency-converter`

> Date : 2026-06-26
> Statut : design validé, en attente de revue finale avant plan d'implémentation.

## 1. Contexte et problème

L'objectif est un boilerplate React Native / Expo réutilisable. La première tentative,
`rn-starter-app`, a été construite **par addition** (reconstruire à la main une base
générique). Elle a **divergé** de l'app de référence : le travail consistait à re-synchroniser
sans fin le starter avec l'UX/les patterns de l'app réelle (cf. son `git log` :
« rebuild language picker to faithfully match reference UX », « align components with design
tokens »…). C'est un travail de Sisyphe, sans résultat concret.

**Décision stratégique :** abandonner l'approche additive et procéder **par soustraction** —
copier l'app de production `all-currency-converter` (qui compile, build et tourne réellement)
puis en retirer tout ce qui est spécifique au métier « conversion de devises ». On hérite ainsi
de l'infrastructure éprouvée (config native, patches, EAS, monétisation, i18n, design system)
sans la ré-implémenter.

## 2. Décisions actées

| Sujet | Décision |
|---|---|
| Stratégie | Soustractive : copie de l'app réelle + retrait du métier |
| Périmètre | Monorepo complet : `apps/api` + `apps/mobile` + `packages/shared`, API généralisée |
| Destination | **Nouveau dossier `rn-starter/`**, historique git neuf (commit initial propre) |
| Sort de l'existant | `rn-starter-app` conservé en archive le temps de récupérer l'outillage, puis supprimé (avec `premium-rn-starter-copie`) sur confirmation explicite |
| API | **Minimal** : `/health` + `auth` + `rateLimiter` + `fcmService` (push) + une route protégée d'exemple |
| Validation | Checkpoints par couche / grand bloc (install + typecheck + build), **pas** à chaque micro-modification |
| Outillage starter | Reprendre de `rn-starter-app` : `scripts/setup.sh`, README template, `.env.example`, `CLAUDE.md` orienté template (artefacts indépendants du code qui a divergé) |

## 3. Frontière métier vs générique

### 🟢 Générique — à conserver

- **api** : `middleware/auth`, `middleware/rateLimiter`, `services/fcmService` (push), structure
  `routes`/`handlers`/`index`.
- **mobile/services** : `storage` (MMKV), `notifications` (setup/channels/payload/backgroundHandler),
  `promo` (coordinator) ; `api/` : `backendService`, `analyticsService`, `crashlyticsService`
  (Firebase), `adService` / `rewardedAdService` (AdMob), `purchaseService` (RevenueCat),
  `googleAuthService`, `ratingService`, `engagementService`.
- **providers** : `QueryProvider`, `ThemeProvider`, `ToastProvider`, `SubscriptionProvider`,
  `AdFreeProvider`, `AlertNotificationProvider` (généralisé).
- **stores** : `onboardingStore`, `settingsStore`, `deepLinkStore`, `alertsStore` (généralisé).
- **components** : `ui`, `layout`, `onboarding`, `paywall`, `premium-gates`, `ads`, `settings`.
- **i18n** : `service` + 9 langues (clés métier à purger).
- **plugins** : `withAndroidFontFilter`, `withPlayCoreResolution`.
- **divers** : `app.config.js` (avec placeholders), patches (`expo-notifications`), config
  Turbo/pnpm/EAS, scripts de release.

### 🔴 Métier — à retirer

- **api** : `services/exchangeRate`, `services/historicalRates`, `routes/rates`, `routes/history`,
  `routes/alerts` (sémantique taux), `handlers/cron` (taux), `utils/supportedCurrencies`,
  `utils/alertNormalize`.
- **shared** : `constants/currencies` ; types `rates`/`history` dans `types/api`.
- **mobile/components** : `conversion`, `currency`, `calculator`, `charts`, `statistics`,
  `export`, `widget`.
- **mobile/services** : `api/historicalRatesService`, `api/exportService`, `api/alertsService`
  (sémantique taux), `services/widget` ; **backup Google Drive** (`googleDriveBackupService`,
  `googleDriveBackupProvider`, `activeBackupProvider`, `backupStore`, `backupTrigger`).
- **stores** : `currencyStore`, `quickConversionsStore`, `statisticsStore`,
  `exportPreferencesStore`, `widgetStore`, `widgetSheetStore`.
- **modules** : `widget-watchlist` (module natif).
- **routes** : `app/statistics` (supprimé) ; `app/index` (remplacé par home démo).

### 🟡 Zones grises — tranchées

- **Alertes : CONSERVÉES, généralisées.** On garde le moteur **local** de notifications
  programmées (`scheduleAlert`, `AlertNotificationProvider`, `alertsStore`, `components/alerts`)
  en retirant le couplage « taux de change ». Devient un exemple générique de notification/rappel
  programmé. À distinguer de `api/alertsService` (listé en 🔴) : ce service synchronisait les
  alertes de **prix** avec l'API de taux — il est retiré avec la couche backend taux. La
  mécanique locale, elle, reste.
- **Backup Google Drive : RETIRÉ.**
- **Export : RETIRÉ.**

## 4. Plan d'exécution par phases

Chaque phase se clôt par un **checkpoint** : `pnpm install` (si besoin) + `typecheck` + `build`
de la couche concernée. Pas de check à chaque fichier.

- **Phase 0 — Bootstrap.** Copier `all-currency-converter` vers `rn-starter/` en excluant
  `node_modules`, `.git`, `.wrangler`, `dist`, `artifacts`, `.turbo`, builds natifs
  (`android/build`, `android/app/build`, `ios/Pods`, `ios/build`). `git init`. `pnpm install`.
  ✅ baseline verte (l'app copiée build avant tout retrait). Copier ce spec dans `rn-starter/docs/`.
- **Phase 1 — shared.** Retirer `constants/currencies`, élaguer `types/api` (drop rates/history),
  ajuster `index.ts`. ✅ build shared.
- **Phase 2 — api.** Retirer services/routes/utils métier. Garder `auth` + `rateLimiter` +
  `fcmService`. Ajouter `/health` + une route protégée d'exemple. Adapter `index.ts` et `types.ts`.
  ✅ typecheck + `wrangler dev`.
- **Phase 3 — mobile, purge métier.** Retirer components, stores, services métier listés, module
  `widget-watchlist`, route `statistics`, backup Drive et export. ✅ typecheck.
- **Phase 4 — mobile, généralisation alertes.** Découpler les alertes du domaine « taux »
  (renommage sémantique, données d'exemple génériques). ✅ typecheck.
- **Phase 5 — home + settings.** Construire un home démo simple et élégant ; reconstruire/élaguer
  `settings` (thème, langue, paywall, rewarded ad, premium, rating, version, liens) ; adapter
  `_layout` (navigation) ; purger les clés i18n métier dans les 9 langues. ✅ `pnpm dev` : l'app
  tourne (onboarding → home → settings).
- **Phase 6 — outillage template.** Reprendre `setup.sh` / README / `CLAUDE.md` de
  `rn-starter-app`. `.env.example` générique. `app.config` avec placeholders (nom, bundle id,
  deep links). Remplacer secrets/identité par des placeholders. ✅ clone→setup→install→build simulé.
- **Phase 7 — archivage.** Après validation complète : supprimer `rn-starter-app` et
  `premium-rn-starter-copie` (**confirmation explicite requise** avant suppression).

## 5. Points de vigilance

- **Secrets / identité** (placeholders obligatoires) : `google-services.json`,
  `GoogleService-Info.plist`, `release.keystore`, `keystore.properties`, `.env`, EAS project id,
  bundle ids, deep links. Indispensable pour un template.
- **Imports orphelins** après suppression : rattrapés au `typecheck` de chaque checkpoint.
- **i18n** : purger les clés métier dans **les 9 langues**, pas seulement `en`.
- **À conserver absolument** : patches (`expo-notifications`), `plugins/` natifs, config
  Turbo/pnpm/EAS.
- **Commit du spec** : le dossier racine `/home/colotcholoman/project` n'est pas un repo git ;
  le spec sera versionné dans le repo neuf `rn-starter/` dès la Phase 0.

## 6. Critère de succès

- `pnpm install && pnpm typecheck && pnpm build` verts à la racine.
- `pnpm dev` lance l'app : onboarding → home démo → settings fonctionnels ; paywall s'ouvre ;
  thème et langue commutent ; une notification/alerte démo est programmable.
- **Zéro** occurrence de `currency` / `conversion` / `rate` dans le code restant (hors deps).
- `scripts/setup.sh` renomme l'app et génère `.env` proprement.
- L'API répond sur `/health` et la route protégée d'exemple en local (`wrangler dev`).
