# Boilerplate audit — roadmap and working context

**This folder is scaffolding for the template itself, not for an app built from it. Delete
`docs/boilerplate-audit/` in any app derived from rn-starter.**

`rn-starter` was extracted from `all-currency-converter`. Three apps then grew from that
extraction — **all-currency-converter**, **deep-focus** and **bg-remover** — and each accumulated
generic improvements, components and hard-won rules that never flowed back. This folder holds the
audit of that gap and the plan to close it.

- `audit-items.json` — all 345 audited items, with the decision and current status of each.
- `audit-console.html` — the same data as a browsable page. Open it in a browser; it needs no server.
- This file — what has shipped, what is left, and the decisions a new session must not re-litigate.

---

## 1. Where things stand

| Lot | Subject | Commits | State |
|---|---|---|---|
| 1 | Correctness: grace period, rating, UMP consent, Test Lab, versionCode | 14 | **merged into `main`** |
| 2 | Build & release: signing, Gradle plugins, GitHub Actions | 6 | **merged into `main`** |
| 3 | The offer is data: offerings-driven paywall, price retry, restore outcomes | 3 | **merged into `main`** |
| 4 | Converter vestiges: dead code, dead keys, dead config | 15 | **on the branch** |
| 5–13 | See §3 | — | not started |

**Counts.** 345 items audited · 235 kept · 84 deferred ("later") · 26 dropped. Of the 235 kept,
**91 have shipped** (62 in lots 1–3, 29 in lot 4) and **141 remain**, spread over lots 5 to 13.
Three more were deliberately held back out of lot 4 — see §4. The per-lot counts in §3 are
remaining work only; the console's lot cards also count those three, which is why two of its
figures are one higher.

The 84 "later" items are not pending work. They were judged useful but never blocking, and they
stay in `audit-items.json` so the judgement does not have to be made twice.

---

## 2. How this work is run

These conventions come from the user and from the three CLAUDE.md files. They are not preferences.

- **One commit per subject.** A lot is a theme, not a commit. Lot 4 produced 15.
- **No tests.** Do not write, suggest or run them. `pnpm typecheck` and `pnpm lint` are the gate,
  and both must be green before every commit.
- **i18n is EN and FR only.** A change that touches keys provides those two. Mass translation of
  the other 18 languages happens in its own session, never alongside feature work. *Deleting* a
  key is not translating: it is removed from all 20 files at once.
- **Living documentation.** `CLAUDE.md` and `apps/mobile/PROJECT_CONTEXT.md` are updated in the
  same commit as the code they describe, surgically.
- **Commit author is `Claude <noreply@anthropic.com>`**, matching lots 1–3 already in `main`.
- **Verify, then refute.** Each lot is investigated by a workflow of two stages: one agent per
  family of items establishes the facts and writes a plan, then a second, adversarial agent tries
  to find the reference it missed. On lot 4 that second stage returned two fatal verdicts and six
  corrections — see §5. Run it on Sonnet with `effort: 'high'`, and group items into families of
  related files rather than one agent per item: a grouped agent catches the cross-references an
  isolated one cannot see, and costs a third as much.

### Pushing

`git push` to `SoroMoise/rn-starter` returns **403** from this environment: the session identity has
no write access (`gate: push_denied`, `gate_scope: identity`). Every lot has therefore been
delivered as a git bundle and merged locally by the user.

To unblock: install the Claude GitHub App on `SoroMoise/rn-starter` with write access via
<https://claude.ai/connect-github>. Until then:

```bash
git bundle create lotN-rn-starter.bundle origin/main..HEAD
# on the user's machine:
git fetch ~/Downloads/lotN-rn-starter.bundle 'refs/heads/*:refs/remotes/lotN/*'
git merge lotN/claude/rn-starter-boilerplate-improvements-nst9w1
```

The remote branch `claude/rn-starter-boilerplate-improvements-nst9w1` is stale at `0b311c8` and
will never advance while pushes are refused, so any "N unpushed commits" warning counts from that
stale ref. The real gap is always `git rev-list --count origin/main..HEAD`.

---

## 3. The remaining lots

Ordered so that lots touching the same files run near each other, and so that documentation comes
last — documenting code that is still moving is work done twice.

### Lot 5 — Promo coordination and AdMob (19 items)

The two remaining **critical** items of the whole audit are here.

- `interstitial-claims-budget` — the interstitial must claim the session's single automatic
  interruption through `promoCoordinator` and declare its visibility. Today it can stack with the
  paywall over the same moment.
- `action-rating-priority-order` — `useActionRating` must increment the counter first, then offer
  the moment to paywall > interstitial > rating, all arbitrated by the coordinator.
- `show-interstitial-awaitable` — `showInterstitialAd()` returns a boolean and resolves on
  `CLOSED`/`ERROR`, not on `show()`. Without it the chain after an ad is guesswork.
- `record-action-allow-promos` — `recordAction({ allowPromos: false })` for moments that must move
  the counter without interrupting.
- `contextual-paywall-requires-offer` — refuse before recording an impression when no offer loaded.
  A user behind a captive portal currently spends a lifetime impression on an empty paywall.
- `ads-unit-ids-literals` + `ads-unit-pending-and-placeholder-guard` — unit ids become literals
  (they ship in the bundle either way, and a truncated `.env` released a build with empty ids in
  a sibling app); a missing or `ca-app-pub-XXXX` id renders nothing.
- `ads-single-visibility-predicate` — one predicate behind every placement, so reserved scroll
  height cannot disagree with the banner.
- `ads-service-set-premium` — `AdService.setPremium`, written only by `SubscriptionProvider`, so
  buying Pro mid-session disarms the preloaded interstitial.
- `ads-docs-ads-md-template` — an `ADS.md` listing every placement, unit and cadence, declared
  living documentation.

### Lot 6 — Rating by moments (4 items)

`RatingMoment` (a finished action raises the ask, never mid-task), the deferred ask consumed on the
next foreground, `evaluateReviewRequest` as a pure function with traced refusals, and
`reviewStorage` replacing `ratingStorage`.

### Lot 7 — Subscription: security and funnel (13 items)

Encrypted MMKV instance for entitlement keys plus `withBackupRules` (excluding the entitlement
store from cloud backup and device transfer closes the "pull the store, flip the flag, restore"
attack), `BillingIssueBanner`, `managementURL`, the `FORCE_PRO` dev override, purchase and
Crashlytics errors classified **by code** with only `unknown` recorded as non-fatal, and the full
purchase funnel — `source`, `offering_id`, `product_id`, `currency` (never `revenue_usd`: a ₹3,499
plan logged as USD reads as $3,499), plus the `PurchaseSurface` axis.

### Lot 8 — Selling surfaces and onboarding (18 items)

`PRO_BENEFITS` as the single list behind every Pro pitch, removal of the fabricated social proof,
the paywall split into reusable blocks with `usePaywallPlans` and a `paywallAnalytics`,
`PremiumGate` blurring instead of erasing, and on the onboarding side: navigation **by step name**
(`OnboardingStepKind`) rather than index, hardware back stepping back instead of leaving the app,
`OnboardingStepLayout`, and the guard that makes the flow sell exactly once, at its last step.

### Lot 9 — UI library and layout (27 items)

`ModalDialog` with `useKeyboardHeight` (Android edge-to-edge stopped resizing modal windows),
`SettingsRow`/`AppSwitch`/`ProBadge`, `useModalSheetPanGesture` and the drag lock, `WheelPicker`,
`ThemedText` deriving a line height whenever a caller sets `fontSize` alone, `SlidingSelector` in
RTL, the centred column at `MAX_CONTENT_WIDTH` with `useResponsiveLayout`, `useHardwareBack`,
`resetToHome`/`ExitToHome`, and the "free cap applies on read, never on write" pattern extracted as
a hook. The three items deferred out of lot 4 (§4) land here too.

### Lot 10 — Notifications (10 items)

The **permission is never requested**: `notificationService.requestPermission` has no caller
anywhere, so on Android 13+ a fresh install never sees the prompt. Ask in context, re-read the
grant on every foreground, expose `canAskAgain`, and add a generic local reminder scheduler
(cancel the whole set, then re-schedule). Android channels are immutable once created — a change
to sound or importance needs a new channel id, not an edit.

### Lot 11 — Plugins and Android build (9 items)

`android.blockedPermissions` (a declared permission is a promise on the store listing),
`withAndroidFontFilter` upgraded to bg-remover's guarded version, the Metro stub for
`@revenuecat/purchases-js-hybrid-mappings` (~750 KB of web SDK in the native bundle), removing the
`privacy` block that never carried legal URLs, and `scripts/setup.sh` propagating the bundle id all
the way to the Play publication step.

### Lot 12 — Assets, legal, api/monorepo (9 items)

A brand-asset generator (the starter ships one 512px RGBA icon doing duty as splash too), a privacy
policy template — the template already bundles AdMob, RevenueCat and Firebase, so it collects data
on day one — legal URLs as constants rather than optional env vars, `apps/api` and
`packages/shared` made explicitly removable, and a bilingual EN/FR site skeleton carrying the legal
pages the APK hardcodes.

### Lot 13 — Documentation and conventions (32 items)

Last, deliberately. The CLAUDE.md sections still missing: large screens, the safe-area contract, the
NativeWind and RN footguns that break silently, Play store policy (urgency, reviews, aggregate
ratings, declared permissions), the i18n voice charter and plural parity, bundle size (Metro does
not tree-shake — import `date-fns` per function), the promo-coordination invariants, and the
frozen structure of `PROJECT_CONTEXT.md`.

---

## 4. Decisions already taken — do not re-open

**Keep Continuous Native Generation.** `android/` and `ios/` stay uncommitted. bg-remover commits
`android/` (45 files, 2.3 MB, touched by 12 of its last 60 commits) and pays for it: it must
`prebuild --clean` and restore the tree in CI. A committed `android/` would also bake
`com.yourcompany.rnstarter` into ~45 files that `setup.sh` would then have to sweep.

**The HTTP layer stays while `apps/api` ships.** Lot 4's audit contained two contradictory
families: one wanted `utils/retry.ts`, `utils/apiErrors.ts` and `hooks/useNetworkStatus.ts`
deleted as dead; the other wanted them kept and wired. They are kept. They are not converter
vestiges — they are unwired generic infrastructure for a backend this repo ships. Their wiring
(`onlineManager` so `refetchOnReconnect` stops being inert in React Native, an `exampleService`
calling `/example`) belongs to lot 9. `@react-native-community/netinfo` stays for the same reason.

**`common.*` keeps keys with no reader.** It is UI vocabulary — *Cancel*, *Save*, *Retry* — already
translated into all twenty languages. Deleting it would bill the next app a translation session for
words it certainly needs. This is the one namespace exempt from "a key with no reader is dead";
the rule is written into CLAUDE.md so the next sweep does not read it as an oversight.

**`aps-environment` stays declared in `app.config.js`.** `expo-notifications` writes that
entitlement unconditionally from its iOS plugin, whatever `mode` says and even with
`ios.entitlements` removed — `mode` merely defaults to `'development'`. Removing the block would
hide the entitlement without removing it. Making it actually disappear needs a dedicated config
plugin running after `expo-notifications` and calling `withEntitlementsPlist`; that is a real
option, not yet taken.

**Product strategy was dropped, mechanism was kept.** The 26 dropped items are mostly one app's
commercial choices rather than reusable machinery: `SoftAskCard`, `LifetimeOfferCard`, pitch
families keyed by source, per-feature rewarded unlocks, the two-tier interstitial cadence, Google
Drive backup, coach-marks. A boilerplate ships the coordinator, not the campaign.

---

## 5. What adversarial verification caught on lot 4

Recorded because it is the argument for keeping that second stage, not a log.

- **`aps-environment` (fatal).** The plan removed the entitlement block with a comment announcing
  the app no longer declares APNs. Reading `node_modules/expo-notifications/plugin/build/withNotificationsIOS.js`
  showed the plugin sets it unconditionally. The commit would have shipped a false statement about
  the binary it produces.
- **`react-dom` (correction).** The plan announced the package's removal. Regenerating the lockfile
  showed it still resolved: `moti` depends on `framer-motion`, whose `react-dom` peer is not
  optional. Only the declaration left `apps/mobile/package.json`; the commit message says so.
- **`notificationSound` / `notificationVibration` (correction).** The audit item claimed six dead
  notification settings. Two are read at boot by `ensureNotificationChannels` and the foreground
  handler. An agent trusting the title would have broken both.
- **`bg-remover` as precedent (correction).** A proposed CLAUDE.md line cited two sibling apps as
  having removed their data-fetching layer. Only deep-focus did; bg-remover never had one. The
  fabricated precedent would have been baked into living documentation on day one.
- **README FCM lines (correction).** The plan corrected one FCM mention and missed two others that
  the same commit made false.

---

## 6. Resuming in a new session

1. Read this file, then `CLAUDE.md` at the repo root.
2. `git log --oneline origin/main..HEAD` — that is the real unpushed gap.
3. Pick the lot. Pull its items:
   ```bash
   python3 -c "import json;d=json.load(open('docs/boilerplate-audit/audit-items.json'));\
   print(json.dumps([x for x in d if x['lot']==5 and x['decision']=='keep' and x['status']=='todo'],ensure_ascii=False,indent=1))"
   ```
4. Run the verify-then-refute workflow over the lot's items grouped into families (§2).
5. Apply, one commit per subject, `pnpm typecheck` and `pnpm lint` green each time.
6. Update `status` in `audit-items.json` for what shipped, and this file's §1 table.
7. Bundle and hand it over until pushes work.
