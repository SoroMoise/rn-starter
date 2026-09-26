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
| 4 | Converter vestiges: dead code, dead keys, dead config | 15 | **merged into `main`** |
| 5 | Promo coordination and AdMob | 18 | **merged into `main`** |
| 6 | Rating by moments: one pure policy, the ask deferred to the user's return | 9 | **merged into `main`** |
| 7 | Subscription: encrypted entitlements, backup rules, FORCE_PRO, billing issue, failures by code, purchase surface | 14 | **merged into `main`** |
| 8–13 | See §3 | — | not started |

**Counts.** 345 items audited · 235 kept · 84 deferred ("later") · 26 dropped. Of the 235 kept,
**146 have shipped** (63 in lots 1–3, 29 in lot 4, 29 in lot 5, 6 in lot 6, 19 in lot 7) and
**86 remain**, spread over lots 8 to 13. Three more were deliberately held back out of lot 4 — see
§4. The per-lot counts in §3 are remaining work only; the console's lot cards also count those
three, which is why its lot 7 figure is one higher and its lot 9 figure two.

Lot 5's 28 include nine items the audit had filed twice, under lots 7, 8 and 13 as well; they
are marked shipped in all their copies, with a note naming the lot-5 item that covered them. One
"later" item (`ad-banner-reserved-height`) shipped with them, as eight did in lots 1–3.

Lot 6's six include two the audit had filed under other lots: `review-storage` (lot 9) and
`claude-rating-play-policy` (lot 13), whose last point needed lot 6. One "later" item,
`rating-storage-keys`, shipped with them, bar the `retryAfter` only the dormant sentiment path
would read.

Lot 7's 19 include nine the audit had filed under other lots — two under lot 8, one under lot 9,
three under lot 10, one under lot 11, two under lot 13 — marked in every copy with a note naming
the lot-7 item that covered them. Six "later" items shipped with them (`entitlement-secure-storage`,
`ads-adfree-encrypted-store`, `subscription-provider-lecture-disque-par-rendu`, `env-force-pro`,
`cles-billing-issue`, `cles-settings-generiques`). Two items it touched stay open, each with a note
saying what is left: `exit-intent-entitlement-keyed` (lot 8, the sheet's copy) and
`claude-storage-security` (lot 13, the rule on remembered settings). Checking the lot also found
two items that had shipped unrecorded — `analytics-has-trial-offer` with lots 1–3,
`adfree-stacking-cap` with lot 5 (c59f846) — now counted there, which is why those two figures
moved by one.

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

Pushes to `SoroMoise/rn-starter` work from this environment since lot 5: a lot is pushed to its
`claude/*` branch, opened as a pull request, reviewed, fixed and merged. Lots 1–4 predate that — the
session identity had no write access then, so they were handed over as git bundles and merged by
hand, which is why the remote still carries a stale `claude/rn-starter-boilerplate-improvements-nst9w1`
at `0b311c8`. The real gap is always `git rev-list --count origin/main..HEAD`.

---

## 3. The remaining lots

Ordered so that lots touching the same files run near each other, and so that documentation comes
last — documenting code that is still moving is work done twice.

### Lot 8 — Selling surfaces and onboarding (13 items)

`PRO_BENEFITS` as the single list behind every Pro pitch, the paywall split into reusable blocks
with `usePaywallPlans` and a `paywallAnalytics`, `PremiumGate` blurring instead of erasing, the
exit sheet's copy following the offer — it still promises "7 days free" whatever the store sells —
and on the onboarding side: navigation **by step name** (`OnboardingStepKind`) rather than index,
hardware back stepping back instead of leaving the app, and `OnboardingStepLayout`. (The guard that
makes the flow sell exactly once, at its last step, shipped in lot 5 with the `openPaywall` choke
point; the removal of the fabricated social proof, and the flow ending on the entitlement, in
lot 7.)

### Lot 9 — UI library and layout (25 items)

`ModalDialog` with `useKeyboardHeight` (Android edge-to-edge stopped resizing modal windows),
`SettingsRow`/`AppSwitch`/`ProBadge`, `useModalSheetPanGesture` and the drag lock, `WheelPicker`,
`ThemedText` deriving a line height whenever a caller sets `fontSize` alone, `SlidingSelector` in
RTL, the centred column at `MAX_CONTENT_WIDTH` with `useResponsiveLayout`, `useHardwareBack`,
`resetToHome`/`ExitToHome`, and the "free cap applies on read, never on write" pattern extracted as
a hook. The three items deferred out of lot 4 (§4) land here too.

### Lot 10 — Notifications (5 items)

The **permission is never requested**: `notificationService.requestPermission` has no caller
anywhere, so on Android 13+ a fresh install never sees the prompt. Ask in context, re-read the
grant on every foreground, expose `canAskAgain`, and add a generic local reminder scheduler
(cancel the whole set, then re-schedule). Android channels are immutable once created — a change
to sound or importance needs a new channel id, not an edit. Read the grant, never
`NOTIFICATION_PERMISSION_REQUESTED` alone: that flag lives in the main MMKV instance, which cloud
backup and device transfer carry to a phone the OS grant does not follow. (The lot's funnel and
Crashlytics items shipped in lot 7.)

### Lot 11 — Plugins and Android build (8 items)

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

### Lot 13 — Documentation and conventions (26 items)

Last, deliberately. The CLAUDE.md sections still missing: large screens, the safe-area contract, the
NativeWind and RN footguns that break silently, Play store policy (urgency, reviews, aggregate
ratings, declared permissions), the i18n voice charter and plural parity, bundle size (Metro does
not tree-shake — import `date-fns` per function), and the frozen structure of
`PROJECT_CONTEXT.md`. The promo-coordination invariants, `ADS.md` and the AdMob-literals rationale
shipped in lot 5, the rating doctrine in lot 6, the grace-period doctrine, the entitlement-storage
rules and the social-proof rule in lot 7.

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

**Only the entitlement store stays out of backups.** bg-remover takes the whole of `mmkv/` out of
cloud backup, and the audit's lot-13 storage item proposed writing that down as the rule. It is that
app's product choice — a photo library a day-stale snapshot resurrected. Here the main instance
holds preferences, the onboarding, the review and paywall spacing, which a reinstall should keep;
excluding more is a decision an app takes for itself, and CLAUDE.md says so.

**The starter ships no data migration.** It has no installs. Lot 4 left AsyncStorage's
`migration.ts` behind for that reason (`pas-de-migration-asyncstorage`), lot 6 the old `@rating_*`
counters (`rating-no-legacy-migration`), lot 7 the plaintext entitlement keys; each time the doc says
what an app porting the change onto a released build owes its users instead.

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

## 6. What verification caught on lot 5

Both stages found something the audit's proposals would have shipped. Stage 1 caught what the
proposals assumed about the library; stage 2 caught what stage 1's plan still left open.

- **A presentation Android never reports (stage 1, fatal to the audit's proposal).** The reference
  — bg-remover's `showInterstitialAd`, settling on `CLOSED`/`ERROR` — assumes one of the two always
  fires. In react-native-google-mobile-ads 15.8.3 the Android `FullScreenContentCallback` leaves
  `onAdFailedToShowFullScreenContent` unhandled: a failed presentation emits nothing, the promise
  hangs, and the coordinator's new visibility flag would have frozen every automatic promo for the
  session. Hence the `OPENED` timeout in `presentFullScreenAd`, cleared the moment the ad opens.
- **A timed-out instance is dead, not unloaded (stage 2, fatal to the plan).** The plan only marked
  it unloaded. The library keeps its own `_loaded` flag up until `CLOSED`/`ERROR` and ignores
  `load()` meanwhile, so one silent failure would have ended interstitials — and the ad-free reward
  — for the life of the process. The instance is replaced instead.
- **Google's sample app id silences the only warning (stage 2).** The config plugin warns only when
  the app id is `undefined`; a literal sample id keeps the template launchable but would let a
  release pair real units with Google's test app unnoticed. The release workflow now refuses it.
- **Lot 1's consent gate was half shipped (stage 1).** Marked done, it gated initialisation only;
  the show-time re-read the item asked for had never landed. It has now, for both formats.
- **A failed rewarded video is not a refusal (stage 1, confirmed by stage 2).** A boolean
  `showRewardedAd` filed failures under `dismissed` and sold the paywall to someone who had declined
  nothing — deep-focus, the proposal's reference, has the same conflation.
- **A choke point that refuses leaves dead buttons behind (stage 1).** The Home CTA was the one
  surface that did not hide its offer from a subscriber.
- **"ACC claims the budget before showing" was false (stage 2).** ACC's interstitial never touches
  the shared budget: it keeps its own one-per-session flag and only avoids overlapping other
  surfaces in time. One budget across ad, paywall and rating is deep-focus's model, chosen here on
  purpose.
- **bg-remover's ADS.md, emptied, would have stated falsehoods (stage 2).** Its encrypted storage,
  `/success` screen, inline banners and per-feature unlocks do not exist here; the starter's file
  was written from this code, keeping only the platform invariants word for word.

The code review on the pull request then found five more, all fixed before the merge — a third
stage worth keeping:

- an ad that opened after the deadline still owed something, a reward or a spent slot, and every
  listener was gone by then;
- a `show()` rejected without an `ERROR` left a dead instance in place, so every later action
  stopped at the ad;
- the interstitial's counter kept climbing through a session whose interruption was spent, so the
  next session opened on an ad;
- `setPremium(true)` left the preloaded instance retrying for a subscriber;
- the contextual impression was recorded before the choke point could still refuse.

Checking the new release gate also exposed a lot-2 bug: the workflow required `app.config.js`
before `pnpm install`, when loading it needs `@expo/config-plugins` — no release could have left.

---

## 7. What verification caught on lot 6

Four items in one family of files, so both stages ran in the session itself rather than as
sub-agents — the second one read ACC's host and bg-remover's policy against the starter's own
lifecycle, and that is where most of this came from.

- **A foreground on Android is not a return (stage 2, fatal to the audit's host).** React Native
  maps `onHostPause` to `background`, so every activity drawn over the app reports one: the
  interstitial, the rewarded video, the billing sheet, a permission dialog, Play's own card. ACC's
  host raises the armed ask on any change to `active`. The rewarded video spends no budget and
  stamps no ad time, and the paywall closes itself once a purchase lands, so Play's card could
  have followed either 1.2 s later. A return now needs `RATING_ASK_MIN_AWAY_MS` (5 min) away.
- **Traced refusals and a flag kept until launch do not mix (stage 2).** ACC disarms only on a
  launch, which costs nothing while its refusals are silent. Traced, the flag would log one
  `rating_ask_suppressed` at every return for as long as a cooldown lasts — up to 126 days. Stage
  2's answer, one evaluation per arming, went a step too far; the review corrected it (below).
- **The host's first check raced the session reset (stage 2).** ACC mounts the host in
  `SubscriptionProvider`, so it checks at launch, while `contextualPaywallService.resetSession()`
  waits for RevenueCat: on a slow network the ask spent the session's interruption and the reset
  handed it back, opening the session to a second one. The host mounts once the session has
  started.
- **bg-remover's base cooldown never applies (stage 1).** `cooldownDays × backoffMultiplier^n` is
  only read once a request exists, so n ≥ 1: `cooldownDays: 14` means 42 days, then 126. The
  invariant that keeps the cap binding is written on 126.
- **The old soft reset delayed what it meant to hasten (stage 1).** It rewound the count in the
  middle of an evaluation and stamped the prompt date, which restarted the 45-day spacing: "a
  prompt sooner" meant 45 more days. The policy now computes where a streak ends instead of
  writing it.
- **`weak_moment` cannot fire in bg-remover (stage 1).** Every moment there is strong. Here it is
  the list an app promotes a candidate into, once the refusal has measured it.
- **The rating's "first usage" was the first action (stage 1).** `RATING_FIRST_USAGE_DATE` was
  stamped at the first evaluation; the policy reads the install date.
- **The sentiment path was never wired (stage 1).** `markAsLater` and `markAsDeclinedForever` had
  no caller and nothing reads `SENTIMENT_GATE_ENABLED`, so CLAUDE.md no longer says flipping the
  flag brings anything back.
- **Deferring the ask removed a lot-5 rule's reason (stage 2).** A failed interstitial ended the
  chain so that no card would land seconds after it; with the ask deferred, only an ad the user
  saw takes the moment.
- **An item filed under another lot.** `review-storage`, which the plan for this lot named, sits
  under lot 9; `lot == 6` alone would have missed it (§9, step 3).

The branch was then reviewed before it was pushed — once by the session reading the whole diff,
once with the code-review skill — and each pass found what the stages had not:

- **The automatic ask sent the user to the store when Play's card could not come** — no Play app,
  or a flow that threw. Google's in-app review guide says an error in the flow must neither be
  reported to the user nor change the app's flow, and with the ask now raised at a launch it would
  have opened the Play Store, or a browser, seconds after the app did. A lots 1–3 decision, reversed
  in its own commit: a failure is traced, and a device with no card is refused before anything is
  spent.
- **The flag's own comment still said the sentiment path was wired** and that flipping it would
  bring the pre-prompt back, against the CLAUDE.md line this lot had just corrected.
- **A collision cleared the ask it only delayed.** One evaluation per arming was right for a
  cooldown and wrong for a collision: an interstitial that spent the session's interruption, then
  a return, cleared an ask the next launch would have made. Only a refusal that outlives the
  session clears the arm now (`refusalOutlivesSession`).
- **A warm return was judged on the install's age at session start.** The session context is a
  snapshot taken once, and an Android process can outlive its launch by days; three days in, a
  return still read as day zero. The install date and the session count are read when the ask is.
- **Google's consent form was invisible to the coordinator.** A launch is where a deferred ask
  falls due and where UMP collects consent again; the form is drawn inside the activity, so
  nothing kept Play's card off it. The form is now a `PromoSurface`, visibility only.
- **The living docs had drifted.** CLAUDE.md's provider tree lacked the host, and the one case
  where the rating goes before the paywall — an ask at a launch takes that session's interruption
  — was nowhere written down as the trade it is.

Declined, each with its reason on the record: migrating the old `@rating_*` counters (the starter
has no installs — `rating-no-legacy-migration`); an expiry on the arm (it stands for an engaged
user not yet asked, and the policy judges the moment it is raised at); stamping the rewarded video
as the last ad for `ad_collision` (it would also move the interstitial's own 90 s interval, an
ad-cadence change for a lot of its own).

The README also still documented `STORE_URL_*` variables that lots 1–3 had removed; it now says
where the store URLs come from.

---

## 8. What verification caught on lot 7

Both stages were launched as sub-agents on Sonnet, one per family — storage and backup, subscription
and funnel — and both died on the account's usage limit before reporting. They ran in the session
instead, against the SDKs' own sources: react-native-mmkv's C++ core in `node_modules`, and
RevenueCat's Android SDK checked out at its tag — purchases-android 10.2.0, the version
purchases-hybrid-common 18.1.0 pins under react-native-purchases 10.0.1.

- **A pending payment rejects; it never resolves (fatal to the audit's table).** `PostReceiptHelper`
  ends a PENDING purchase in `onError(PaymentPendingError)`. bg-remover's `FAILURE_BY_CODE`, the
  reference, files code 20 under `unknown`: a Crashlytics non-fatal and "Something went wrong" for a
  purchase the store has taken. Here it is `pending` — `purchase_pending`, and nothing shown.
- **The same fact refuted the living docs.** CLAUDE.md, the provider and `analyticsService` all said
  a deferred transaction resolves with no entitlement, and the provider traced that path as
  `purchase_pending`. A purchase that resolves without `ENTITLEMENT_PREMIUM` is a sale the dashboard
  never attached to it, or an entitlement id left at the template's `'premium'`: the user paid for
  nothing and the funnel called it pending. It is a `purchase_failed` with
  `error_code: 'entitlement_inactive'` now, and a non-fatal naming the entitlements that are active.
- **ITEM_ALREADY_OWNED is not a bug.** Play's code reaches the app as
  `PRODUCT_ALREADY_PURCHASED_ERROR` (`google/errors.kt`), which the reference also filed under
  `unknown`. It is `already_owned`, and the toast points at *Restore purchases*.
- **MMKV reads 16 bytes of the key and ignores the rest.** `AESCrypt` copies `min(length, 16)`, and
  react-native-mmkv only complains when an instance fails to open: bg-remover's 27-byte key is its
  first 16 characters. The starter's is exactly 16 bytes, and its comment says why.
- **Every Play subscriber read as `other` (not in the audit).** The store product of a subscription
  is `subId:basePlanId` (`GoogleStoreProduct`) while the entitlement reports the two apart, and
  `deriveActiveSubscription` compared the joined id with the bare one. Both spellings match now, as
  in deep-focus.
- **A forced tier could ship.** The release restores `.env` from `MOBILE_DOTENV`, so a `FORCE_PRO`
  left in the secret would give every user Pro, and a `FORCE_FREE` lock every subscriber out. The
  workflow refuses either, the way it refuses Google's sample AdMob app id; its grep was run
  against the step's script as extracted from the YAML.
- **What the encryption does not cover.** RevenueCat keeps its own CustomerInfo in the SDK's shared
  preferences (`DeviceCache`) and serves it offline by default (`CacheFetchPolicy.CACHED_OR_FETCHED`),
  so the app's copy only seeds the first frames and the launches the SDK has nothing cached for.
  CLAUDE.md says the lot closes the cheap attack on the app's copy, not on the SDK's.
- **The backup scope** is the entitlement store only (§4). A prebuild run in the session produced
  both rule files and both manifest attributes; neither Expo's template nor any library in
  `node_modules` sets either attribute, and bg-remover ships the same two over the same Firebase,
  AdMob and RevenueCat SDKs.
- **The premium step stranded a paying user.** Beyond the ref race the audit named, the effect
  watching the tier returned early on the premium step: a purchase from `PremiumValueStep` itself
  left the subscriber on the pitch, whose skip link then offered them the exit sheet's trial.

Reading the whole branch before the push — once in the session, once with the code-review skill —
found:

- `ADS.md` still filed `@ad_free_until` under "plain MMKV", and CLAUDE.md said the encrypted file
  "can no longer be pulled, edited into Pro and put back", which a key shipped in the bundle does
  not stop. Both corrected.
- The commit writing down the offline signal first misdescribed the sibling apps: they clear their
  cache on a verified "no entitlement" only while NetInfo reads online, which ignores an answer the
  store did give. Corrected before the push.
- The code-review skill's one finding, the missing plaintext-to-encrypted migration, is declined
  with its reason on the record (§4).

Declined as well: a per-app encryption key generated by `setup.sh` (the key is obfuscation whatever
its value, and one regenerated after a release would drop every offline cache); a toast for a
pending payment (the store's own flow has told the user); and hiding a billing-issue date already
past (the store's next answer clears it).

Found along the way and left out of this lot: when `purchaseService.initialize()` throws — Expo Go,
where the native module is missing — the provider returns before `loadOfferings` and
`isLoadingPrices` stays true, so the price notice spins for good (the retry of lots 1–3 covers a
failed fetch, not a failed configure); and `NOTIFICATION_PERMISSION_REQUESTED` rides the backups
(lot 10, above). Fixed on the way instead: `utils/trialOffer.ts`, dead since lot 3
while CLAUDE.md still cited it; a `PostPurchaseModal` PROJECT_CONTEXT.md credited the provider with;
and a README still promising a monthly and annual pair with a 7-day trial, and listing an
entitlement id and product ids among the env variables.

---

## 9. Resuming in a new session

1. Read this file, then `CLAUDE.md` at the repo root.
2. `git log --oneline origin/main..HEAD` — that is the real unpushed gap.
3. Pick the lot. Pull its items, then search the other lots for items on the same files — the
   audit filed some under a neighbouring lot:
   ```bash
   python3 -c "import json;d=json.load(open('docs/boilerplate-audit/audit-items.json'));\
   print(json.dumps([x for x in d if x['lot']==8 and x['decision']=='keep' and x['status']=='todo'],ensure_ascii=False,indent=1))"
   ```
4. Run the verify-then-refute workflow over the lot's items grouped into families (§2).
5. Apply, one commit per subject, `pnpm typecheck` and `pnpm lint` green each time.
6. Update `status` in `audit-items.json` for what shipped (`done-lotN`, in every copy of an item the
   audit filed twice), then the `ITEMS` line of `audit-console.html`, which embeds its own copy of
   the data, and its `SHIPPED_LOT` map, which must learn the new status; then this file's §1 table.
7. Push the branch, open the pull request, review it, fix what the review finds, and merge.
