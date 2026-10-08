# RN Starter

A premium React Native / Expo monorepo boilerplate with production-grade monetization, i18n, theming, a notification system ready to wire up, and a Cloudflare Workers API — ready to customize into your next app.

---

## What is inside

- **Monetization** — a RevenueCat paywall rendered from the store's live offering, a contextual paywall paced by a generic action counter, AdMob (banner, interstitial, rewarded) behind Google's consent gate, a payment-problem banner and an offline allowance for subscribers
- **Platform** — light / dark / system theme with RTL, 20 lazy-loaded languages (EN and FR as source of truth), local notifications ready to wire up (nothing asks or schedules until the app does), Play's in-app review card armed by an action, Firebase Analytics + Crashlytics
- **Navigation and UI** — Expo Router with a root stack over two tabs, an onboarding navigated by step name, a blurred tab bar, a bottom sheet and a centred dialog kept clear of the keyboard, settings rows, a thumb-sized wheel picker, a centred column on large screens, accessibility roles and labels throughout
- **Backend (optional)** — a Cloudflare Worker (Hono) with API-key auth, a rate limiter, a server-side RevenueCat check and an FCM sender, removable in one command
- **Website** — a static Next.js site in English and French carrying the privacy policy and terms the app links to

Stack: Expo SDK 54 / React Native 0.81.5 / React 19, Expo Router 6, NativeWind 4, Zustand 5 + MMKV, TanStack Query 5, i18next, Reanimated 4 + Moti, @react-native-firebase, react-native-google-mobile-ads, react-native-purchases, expo-notifications, Hono, TypeScript strict, pnpm workspaces + Turborepo. Exact versions: `apps/mobile/package.json` and `apps/api/package.json`.

---

## Monorepo Structure

```
rn-starter/
├── apps/
│   ├── mobile/          # Expo SDK 54 / React Native app (iOS + Android)
│   ├── web/             # Next.js static site — home, privacy policy, terms (EN + FR)
│   └── api/             # Cloudflare Workers API (Hono) — optional
├── packages/
│   └── shared/          # The API's TypeScript types (HealthResponse, ApiErrorResponse)
├── scripts/
│   ├── setup.sh         # Interactive setup script — personalizes the template
│   ├── remove-api.sh    # Takes out apps/api, packages/shared and the app's network layer
│   └── generate-brand-assets.py  # Draws the icon, splash, notification icon and favicon
└── turbo.json
```

### Mobile app layout

```
apps/mobile/
├── app/
│   ├── _layout.tsx      # Root layout — providers + tab navigator
│   ├── index.tsx        # Home tab (premium demo)
│   └── settings.tsx     # Settings tab
├── components/          # ads/, layout/, onboarding/, paywall/, settings/, ui/
├── constants/           # admob, config, legal, rating
├── hooks/               # usePremium, useCappedByTier, useHardwareBack, useKeyboardHeight,
│                        #   useResponsiveLayout, useSheetSnap, useTabBarPadding, ...
├── i18n/                # service.ts + languages/ (20 JSON files)
├── providers/           # AdFreeProvider, QueryProvider,
│                        #   SubscriptionProvider, ThemeProvider, ToastProvider
├── services/
│   ├── api/             # adService, analyticsService, backendClient, contextualPaywall/,
│   │                    #   crashlyticsService, engagementService, exampleService, paywallAnalytics,
│   │                    #   purchaseService, ratingService, rewardedAdService
│   ├── notifications/   # permission, channel, daily reminders
│   ├── promo/           # promoCoordinator (anti-stacking authority)
│   └── storage/         # mmkv, adapter, keys, domains/
├── stores/              # onboardingStore, settingsStore
└── types/               # app-wide TypeScript types
```

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/your-org/rn-starter.git
cd rn-starter
```

### 2. Run the setup script

The interactive setup script personalizes the template (app name, bundle ID, scheme, the website serving the legal pages, the support address) and copies the example secret files:

```bash
bash scripts/setup.sh
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Add Firebase and secret files

**Mobile:**

```bash
# Add your real google-services.json (Android Firebase)
cp apps/mobile/google-services.json.example apps/mobile/google-services.json
# Edit apps/mobile/google-services.json with your Firebase project values

# Add your real GoogleService-Info.plist (iOS Firebase) — no example provided,
# download it from the Firebase Console and place it at:
# apps/mobile/GoogleService-Info.plist

# Fill in your real .env values
# (setup.sh creates apps/mobile/.env from .env.example if absent)
```

**API:**

```bash
# Fill in your real .dev.vars values
# (setup.sh creates apps/api/.dev.vars from .dev.vars.example if absent)
```

### 5. Start the dev server

```bash
pnpm dev:mobile     # Expo dev server
pnpm dev:api        # Cloudflare Worker local dev
```

### No backend?

`apps/api` is there for the app that needs a server of its own — the entitlement checked server-side,
push sent by FCM. Most apps need neither, and a Worker nobody deploys still costs an install, a
workspace package, a CI workflow and two `.env` variables that look wired. Take it out, with the
network layer the app keeps only to talk to it, before writing any code:

```bash
bash scripts/remove-api.sh
```

It lists what goes and asks first, refuses a working tree with uncommitted changes (git is the only
way back), and updates the lockfile. What it does not touch is the prose: the sections of
`CLAUDE.md`, `apps/mobile/PROJECT_CONTEXT.md` and this README that describe the backend.

---

## Day one: what the app needs, and what can wait

The app runs on an Android device before a single account exists. What a missing piece actually
does:

| Missing | What happens |
|---|---|
| `apps/mobile/google-services.json` | The Android prebuild refuses. The example, which `setup.sh` names after your package, is enough to build and launch; analytics and crash reports go nowhere until it is the one the Firebase Console gives you. |
| `apps/mobile/GoogleService-Info.plist` | The iOS prebuild refuses — and `pnpm --filter mobile preb` prebuilds both platforms. There is no example: use `preb:android` until the Firebase project exists. |
| AdMob ids | Nothing in development: every placement serves Google's test ads. A release requests nothing from a unit left pending, and the release workflow refuses Google's sample app id. |
| RevenueCat keys | The paywall and the onboarding's premium step say the offer is unavailable and offer a retry. `FORCE_PRO=true` in `.env` walks the Pro paths meanwhile. |
| `BACKEND_URL`, `BACKEND_API_KEY` | Nothing until the app calls its backend: the first call throws, naming both. |
| The website and the support address | The legal links open the placeholder domain; the release workflow refuses it. |
| `apps/mobile/keystore.properties` | Nothing until a release build, which fails on purpose and says what to write. |

### Files that are not committed

| File | Start from | Needed for |
|---|---|---|
| `apps/mobile/.env` | `.env.example` — `setup.sh` copies it | every build; its placeholders run |
| `apps/mobile/google-services.json` | `google-services.json.example`, then the Firebase Console's | the Android prebuild |
| `apps/mobile/GoogleService-Info.plist` | the Firebase Console — no example | the iOS prebuild |
| `apps/mobile/keystore.properties` | `keystore.properties.example` | a release build |
| `apps/mobile/release.keystore` | the `keytool` command in `keystore.properties.example` | every release build, for the life of the app — keep it where it cannot be lost |
| `apps/api/.dev.vars` | `.dev.vars.example` — `setup.sh` copies it | the Worker in local development |

### The accounts, in order

- [ ] **Firebase** — one project, with the Android app (your package id) and the iOS app (your
  bundle id). Replace both config files: everything after this step reports its crashes.
- [ ] **Play Console** — create the app and upload the first build by hand to the internal track
  (Android release, *First release*), then create the subscriptions or products Pro is sold as.
  Play only lets you create them once a build that uses Play Billing is on a track.
- [ ] **RevenueCat** — a project connected to the Play app, the products imported, an entitlement
  whose identifier is `ENTITLEMENT_PREMIUM` (`'premium'`, in `apps/mobile/constants/purchases.ts`)
  with every product attached, and a current offering. The public SDK keys go in `.env`. A
  one-time product in the offering is offered when the paywall closes rather than in its plan
  list; the offering's metadata `{ "lifetimePlacement": "inline" }` lists it with the others.
- [ ] **AdMob** — the app and one unit per placement: the app ids in `app.config.js`, the unit ids
  in `constants/admob.ts` (`apps/mobile/ADS.md`).
- [ ] **The website** — `apps/web` live with its legal pages filled in (Website). The Play listing
  asks for the privacy policy's URL, and the data safety form must say what the policy says.
- [ ] **Release automation** — the Play service account and the repository secrets (Android
  release).
- [ ] **Cloudflare**, if the app keeps `apps/api` — the Worker's secrets, RevenueCat's secret key
  among them (Configuration), then `BACKEND_URL` and `BACKEND_API_KEY` in `.env`.

---

## Native Build (Continuous Native Generation)

The native `ios/` and `android/` folders are not committed — they are fully regenerated by Expo CNG:

```bash
# Generate both platforms
pnpm --filter mobile preb

# Or per platform
pnpm --filter mobile preb:android
pnpm --filter mobile preb:ios
```

After prebuild, use:

```bash
pnpm android   # expo run:android
pnpm ios       # expo run:ios
```

Nothing under `android/` is edited by hand — the next prebuild rewrites it; what the native project
needs is a config plugin in `apps/mobile/plugins/`. And when a native build breaks, never reach for
`./gradlew clean`: it wipes the `build/` folders of the React Native modules in `node_modules/`,
codegen included, which the new architecture's CMake build points at, and the build fails further
on, somewhere that looks unrelated. Start over with a clean prebuild instead:

```bash
pnpm --filter mobile preb:android --clean
```

---

## Android release (GitHub Actions)

`.github/workflows/release-android.yml` versions, builds, signs and publishes the Android app to the Play Console's **internal** track, with no local machine. It runs when a pull request carrying the **`release`** label is **merged** into `main`, or by hand (`workflow_dispatch`). Closing a pull request, or merging one without the label, releases nothing.

### Versioning

The next version comes from the Conventional Commits since `.last_release_commit`:

| Commits since the last release | Bump |
|---|---|
| a `type!:` subject or a `BREAKING CHANGE` footer | major — `2.0.0` |
| at least one `feat:` | minor — `1.1.0` |
| anything else | patch — `1.0.1` |

The base is `const version` in `apps/mobile/app.config.js`, and `versionCode` follows that file's formula. Once the build is on Play, the workflow pushes `chore(release): vX.Y.Z [skip ci]` to `main` with the new version and marker — the git history is the changelog (see `CHANGELOG.md`). The pull request's title becomes the release's name in the Play Console, cut at 50 characters, so lead with what the release does.

### First release

The Play Developer API only publishes to an app that already holds a build, so the first one goes up by hand:

1. Generate the upload keystore (the command is in `apps/mobile/keystore.properties.example`), copy that file to `keystore.properties` and fill it in. Keep the keystore out of the repository and somewhere it cannot be lost: every later build must be signed with it.
2. `pnpm --filter mobile preb:android`, then `pnpm --filter mobile build:aab`, and upload `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab` to the internal track in the Play Console. It is `1.0.0`, versionCode `1000000`.
3. Record it — `git rev-parse HEAD > .last_release_commit`, committed — so the workflow's first run counts only what came after.
4. In Google Cloud, create a service account with a JSON key and enable the Google Play Android Developer API; in the Play Console, invite its email under *Users and permissions* with release rights on the app.

### Repository secrets

| Secret | Holds | Where it comes from |
|---|---|---|
| `MOBILE_DOTENV` | the whole `apps/mobile/.env` | the file's contents — never with `FORCE_FREE` or `FORCE_PRO`, which the workflow refuses |
| `GOOGLE_SERVICES_JSON` | `apps/mobile/google-services.json` | the file's contents, from the Firebase Console |
| `ANDROID_KEYSTORE_BASE64` | the upload keystore | `base64 -w0 apps/mobile/release.keystore` (macOS: `base64 -i`) |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore's password | `STORE_PASSWORD` in `keystore.properties` |
| `ANDROID_KEY_ALIAS` | the key's alias | `KEY_ALIAS` |
| `ANDROID_KEY_PASSWORD` | the key's password | `KEY_PASSWORD` |
| `PLAY_SERVICE_ACCOUNT_JSON` | the Play Developer API key | the service account's JSON key |

The workflow also refuses to publish with Google's sample AdMob app id still in `app.config.js`, or with the template's placeholder site or support address still in `apps/mobile/constants/legal.ts`.

### When a release fails

- **`main` refuses direct pushes.** The version commit is pushed with the workflow's own `GITHUB_TOKEN`, which neither a ruleset nor branch protection can exempt. On a protected `main` the build reaches Play, the bump is refused, and the next run recomputes the same version, which Play rejects. Leave `main` open to that push, or give the checkout step (`actions/checkout`'s `token`) a GitHub App token or a PAT the rule lets through.
- **All three publish attempts failed.** Read the first attempt and the job summary before re-running: an attempt can commit its Play edit and still report failure, and the later ones then die on `apkUpgradeVersionConflict`. Bump `app.config.js` and `.last_release_commit` by hand to match what the Play Console holds — a plain re-run recomputes the same rejected version.

The AAB is kept as a build artifact only when no attempt landed; `.github/workflows/purge-artifacts.yml` clears them on demand, since Actions storage is billed on a private repository.

---

## Website (`apps/web`)

A static Next.js site: English at the root, French under `/fr`, with a home page, the privacy
policy and the terms. The app opens `/privacy` and `/terms` on it from Settings and beside every
buy button, and Play requires a privacy policy that opens — so the site goes live before the first
release.

```bash
pnpm dev:web      # http://localhost:3000
pnpm build:web    # writes apps/web/out/
```

### Before it goes live

- `scripts/setup.sh` has written the app's name, domain, package and support address into
  `apps/web/lib/site.ts`. Fill in the publisher and the date the pages take effect there.
- Replace every bracketed passage in `apps/web/content/en/legal.ts` and `fr/legal.ts`, and make
  both documents say what your app does: remove a section it does not need (notifications, for an
  app that sends none), add one for every SDK, permission or server it adds. The text is written
  for the SDKs the starter ships — AdMob, Firebase Analytics and Crashlytics, RevenueCat — and
  follows the categories of Play's data safety form; it is a starting point, not legal advice, so
  have it reviewed. The pages show a template notice for as long as a placeholder remains.
- Fill in the home page's copy in `apps/web/content/*/site.ts`.

### Hosting

`out/` is plain files. Whatever the host, it must:

- **Serve `/privacy` from `privacy.html`**, beside the `privacy/` folder the export also writes.
  Cloudflare Pages, Netlify and Vercel do it on their own; Firebase Hosting needs
  `"cleanUrls": true`.
- **Send the security headers**, which a static export cannot set itself:
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()` and, once the domain is
  HTTPS-only for good, `Strict-Transport-Security: max-age=63072000; includeSubDomains`.

### The URLs are a contract

Every build already installed opens `/privacy` and `/terms` on the domain it shipped with. So:

- The two paths are never renamed and never translated — the French pages are `/fr/privacy` and
  `/fr/terms` — and never lose their page: a dead privacy link beside a subscribe button is a Play
  review rejection, and no later release reaches the builds already out.
- Moving to another domain changes `APP_WEBSITE_URL` in `apps/mobile/constants/legal.ts` and
  `SITE.url` in `apps/web/lib/site.ts` in the same commit — and keeps the old domain redirecting
  for as long as builds carrying it are in use.

---

## Commands

All commands run from the repo root unless noted.

| Command | Description |
|---|---|
| `pnpm dev` | Turbo dev (all workspaces) |
| `pnpm dev:mobile` | Expo dev server only |
| `pnpm dev:api` | Cloudflare Worker local dev |
| `pnpm dev:web` | Next.js dev server for the site |
| `pnpm build:web` | Static export of the site into `apps/web/out` |
| `pnpm android` | `expo run:android` |
| `pnpm ios` | `expo run:ios` |
| `pnpm build` | Turbo build |
| `pnpm typecheck` | TypeScript check (all workspaces) |
| `pnpm lint` | ESLint (all workspaces) |
| `pnpm deploy:api` | `wrangler deploy` |
| `pnpm --filter mobile preb` | `expo prebuild` (generate native projects) |
| `pnpm --filter mobile analyze` | Android bundle broken down by package, in `apps/mobile/report.html` — run it before and after a dependency change |

---

## Configuration

### Environment variables — mobile (`apps/mobile/.env`)

See `apps/mobile/.env.example` for all keys with comments. Key groups:

- **REVENUECAT_*** — the two public SDK keys; the entitlement id is a constant in `constants/purchases.ts`, and the plans come from the store's current offering
- **FORCE_FREE / FORCE_PRO** — development overrides of the subscription tier, never written to the offline cache; the release workflow refuses them
- **BACKEND_URL / BACKEND_API_KEY** — points to your deployed Cloudflare Worker

AdMob identifiers are not environment variables: the app IDs are literals in
`apps/mobile/app.config.js` (Google's sample IDs until you replace them) and the ad unit IDs
in `apps/mobile/constants/admob.ts`. `apps/mobile/ADS.md` is the advertising reference —
placements, cadence, gates, and what to set before the first release.

Legal links are not environment variables either: `apps/mobile/constants/legal.ts` builds the
privacy policy and terms URLs from the app's website, beside the support address, and
`scripts/setup.sh` asks for both. A public page is not a secret, and a build keeps the links it
shipped with.

Store URLs are not environment variables either: `apps/mobile/constants/rating.ts` derives the
Play Store ones from the package id, and the App Store one waits for App Store Connect's numeric
id (`APP_STORE_APP_ID`) — the bundle id opens nothing there.

### Environment variables — API (`apps/api/.dev.vars`)

See `apps/api/.dev.vars.example` for all keys. For production, set these as Cloudflare Worker secrets:

```bash
wrangler secret put API_KEY
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
wrangler secret put REVENUECAT_SECRET_API_KEY
```

`REVENUECAT_PROJECT_ID` is not a secret: it sits in `[vars]` in `apps/api/wrangler.toml`. Until it and
`REVENUECAT_SECRET_API_KEY` are both set, the Worker's entitlement check lets every caller through
and says so in its logs. The KV namespace that caches its answers is created by the first
`pnpm deploy:api`.

---

## License

MIT
