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
| 8 | Selling surfaces and onboarding: one benefit list, the offer through one hook, what a buy button charges stated beside it, steps by name, the back key | 18 | **merged into `main`** |
| 9 | UI library and layout: the sheet split and its drag lock, `ModalDialog` and the keyboard, settings rows, the wheel, RTL-safe sliders, the centred column, the back key and the stack reset for routes, limits applied on read, and the network layer held back from lot 4 wired in | 34 | **merged into `main`** |
| — | Off-audit fixes: the price spinner a failed configure left, `withRetry`'s status, the sheet's close labels, the push notifications the home screen sold, `PremiumGate`'s dead prop | 5 | **merged into `main`** |
| 10 | Notifications: the channel frozen and the sound settings it ignored dropped, the grant read off the OS, expo's record of asked permissions kept out of backups, a daily reminder scheduler that refuses out loud | 12 | on `claude/lot-10-notifications` |
| 11–13 | See §3 | — | not started |

**Counts.** 345 items audited · 235 kept · 84 deferred ("later") · 26 dropped. Of the 235 kept,
**204 have shipped** (65 in lots 1–3, 29 in lot 4, 31 in lot 5, 6 in lot 6, 19 in lot 7, 16 in
lot 8, 33 in lot 9, 5 in lot 10) and **31 remain**, spread over lots 11 to 13. The three held back
out of lot 4 (§4) closed with lot 9, so nothing is deferred any more and the console's lot cards
match §3.

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

Lot 8's 16 include three the audit had filed under other lots — `onboarding-store-trim` (lot 9),
`analytics-step-name` (lot 10) and `paywall-cles-offre` (lot 13) — marked in every copy with a note
naming what covered them. Seven "later" items shipped with them: `paywall-analytics-service` and
`use-paywall-plans-hook` (the lot-7 copies), `premiumgate-blur`, `analytics-paywall-helper`,
`onboarding-offer-driven-copy`, `onboarding-pro-benefits-single-list`, `onboarding-gradient-tokens`.
Four items it touched stay open, each with a note saying what is left: `hook-hardware-back` (lot 9,
the route-scoped hook), `claude-navigation-back` (lot 13, resetting the stack when a flow ends),
`gradients-tokens` (lot 13, two files still literal) and `brand-color-tokens` (later, the literal
violets and greens).

Lot 9's 33 include the three held back out of lot 4 — the network layer: `util-retry-dedupe`,
`doc-keep-network-api-utils`, and `drop-netinfo-from-entitlement`, closed with its deletion decided
against (§4) — and seven the audit had filed under lot 13: `datefns-imports-par-fonction`,
`datefns-locale-map-hoist`, `themedtext-lineheight-derive`, `claude-caps-on-read`,
`claude-large-screens`, `claude-safe-area-contract` and `claude-navigation-back`, each marked in
every copy with a note naming what covered it. Seven "later" items shipped with them:
`sheet-usesheetsnap`, `use-responsive-layout`, `hook-keyboard-height`, `util-date-locale-cache` and
`claude-persist-rehydrate` (copies of lot-9 items), `modal-self-cap-large-screen` (the paywall caps
itself) and `pro-badge-component`. One lot-9 item had shipped unrecorded — `hook-ad-visible` is
lot 5's `useAdPlacementActive` (29d7640) — and is counted there now, which is why lot 5's figure
moved by one. Three lot-13 items it touched stay open, each with a note saying what is left:
`claude-nativewind-footguns` (three of its four traps), `claude-android-modal-keyboard` (the
measured-height echo) and `claude-bundle-size` (the Metro stub and the `analyze` discipline).

Three lot-13 items had shipped unrecorded, found when the remaining lots were planned against the
code: `claude-build-release` and `claude-ci-release` with lot 2's plugins and workflow (5f72702,
79cc993) — bar the first one's `./gradlew clean` rule, which stays with `doc-gradlew-clean-interdit`
— and `claude-ads-consent`, whose rule came with lot 1's consent gate and whose show-time re-read with
lot 5 (0d989e4). They are counted there now, which is why those two figures moved.

Lot 10's five include one the audit had filed under lot 13, `claude-notification-permission`: its
rules went into CLAUDE.md with the code they describe. One item shipped otherwise than proposed —
`notif-channel-immutable`, whose delete-and-recreate changes nothing on Android (§11): the channel
is frozen and the two settings it ignored are gone. No "later" item shipped with them;
`notif-channels-table` stays later, since one channel needs no table. The lot's onboarding step did
not ship either, by decision (§4). The branch also carries two commits outside the audit:
`pnpm lint` had been red on `main` since 5542d78, and the CHANGELOG still listed the onboarding's
old third step.

The off-audit fixes are the five things §8 to §10 found along the way and left out, bar the
onboarding's large-screen cap (a design pass) and bg-remover's `slotOf` (another repository). §8
blamed Expo Go for the configure that throws: react-native-purchases 10 runs in browser mode there
(`shouldUseBrowserMode`), so what reaches that catch is a build without the native module, or a key
that is not a string. Whoever stubs `@revenuecat/purchases-js-hybrid-mappings` in lot 11 should
know that browser mode is what the stub removes — harmless while MMKV, Firebase and AdMob already
keep the app out of Expo Go.

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

### Lot 11 — Plugins and Android build (8 items)

`android.blockedPermissions` (a declared permission is a promise on the store listing — never
`POST_NOTIFICATIONS` nor `RECEIVE_BOOT_COMPLETED`, §4),
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

### Lot 13 — Documentation and conventions (14 items)

Last, deliberately. The CLAUDE.md sections still missing: the NativeWind and RN footguns that break
silently (the line-height one is written), the measured-height echo beside the modal-keyboard rule,
Play store policy (urgency, reviews, aggregate ratings, declared permissions), the i18n voice
charter and plural parity, a bundle-size section (the `date-fns` rule is in the code style; the
Metro stub and `pnpm analyze` are not), code-style layers and comments, and the frozen structure of
`PROJECT_CONTEXT.md` — which by now needs its "Hooks" section: lot 9 put a dozen hooks and
components in its Styling section for want of one. The promo-coordination invariants, `ADS.md` and
the AdMob-literals rationale shipped in lot 5, the rating doctrine in lot 6, the grace-period
doctrine, the entitlement-storage rules and the social-proof rule in lot 7, the back-key and
step-name rules in lot 8, large screens, the safe-area contract, limits on read, the persist flush
and the stack reset in lot 9, the notification permission and channel rules in lot 10.

---

## 4. Decisions already taken — do not re-open

**Keep Continuous Native Generation.** `android/` and `ios/` stay uncommitted. bg-remover commits
`android/` (45 files, 2.3 MB, touched by 12 of its last 60 commits) and pays for it: it must
`prebuild --clean` and restore the tree in CI. A committed `android/` would also bake
`com.yourcompany.rnstarter` into ~45 files that `setup.sh` would then have to sweep.

**The HTTP layer stays while `apps/api` ships.** Lot 4's audit contained two contradictory
families: one wanted `utils/retry.ts`, `utils/apiErrors.ts` and `hooks/useNetworkStatus.ts`
deleted as dead; the other wanted them kept and wired. They are kept. They are not converter
vestiges — they are generic infrastructure for a backend this repo ships, wired in lot 9:
`onlineManager` reads the NetInfo subscription, so `refetchOnReconnect` is no longer inert in
React Native, and `exampleService` calls `/example` through `withRetry` and the one axios client.
`@react-native-community/netinfo` stays for the same reason; an app without a backend removes all
of it together (CLAUDE.md, Data Fetching).

**`withRetry` is for calls made outside a query.** A `queryFn` calls the client directly: the
query client retries on its own, and a `withRetry` inside it would multiply the attempts.

**A position that slides along a row is logical, and only its travel flips in RTL.** Never
bg-remover's `slotOf` over a physical `left: 0`: React Native swaps `left` and `right` in RTL by
default, so that anchor starts on the right (§10).

**The column caps content, not chrome.** `ScreenContainer`'s column holds what a screen draws; the
tab bar and the bottom sheets span the window, and a native modal with content of its own caps
itself (`PaywallModal`, `ModalDialog`). The onboarding is not capped yet — a design pass, not a
structural one.

**The persist flush is documented, not shipped as a helper.** No starter store has a `merge` that
changes what was on disk; a helper would have no caller, and the four lines are in CLAUDE.md.

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

**Only the entitlement store stays out of backups, of what the app itself writes.** bg-remover
takes the whole of `mmkv/` out of cloud backup, and the audit's lot-13 storage item proposed writing
that down as the rule. It is that app's product choice — a photo library a day-stale snapshot
resurrected. Here the main instance holds preferences, the onboarding, the review and paywall
spacing, which a reinstall should keep; excluding more is a decision an app takes for itself, and
CLAUDE.md says so. The one other exclusion, since lot 10, holds no user data: expo-modules-core's
record of the permissions it asked for on the device, which restored elsewhere reads as a permanent
denial (§11).

**The starter ships no data migration.** It has no installs. Lot 4 left AsyncStorage's
`migration.ts` behind for that reason (`pas-de-migration-asyncstorage`), lot 6 the old `@rating_*`
counters (`rating-no-legacy-migration`), lot 7 the plaintext entitlement keys; each time the doc says
what an app porting the change onto a released build owes its users instead.

**The onboarding sells the default plan; choosing a plan is the paywall's job.** The audit had two
items on the premium step: bg-remover's, which lists every plan like its paywall, and deep-focus's,
one CTA over the offering's default plan with the trial frieze. The step keeps the second and
shares everything else with the paywall — `usePaywallPlans`, the perks, the trust lines, the legal
note, the links — so it cannot describe the plan differently.

**`PRO_BENEFITS` names only what the starter gates, which is its ads.** Every other line the two old
lists sold — reminders, priority support, push notifications, "every premium feature", a widget —
had nothing behind it, and a benefit written into the template is one every derived app ships on
day one. An app adds a benefit in the change that adds its gate.

**No example onboarding step ships.** `OnboardingStepLayout` has no caller until an app adds a step
(an app's notification ask is the natural first one): a demo step would be a screen every app
shows on day one, asking nothing.

**The starter asks for no permission and schedules nothing; the notification plumbing stays for the
apps built on it.** Decided on 2026-09-26, against the lot-10 plan to make an onboarding step the
first caller of the ask. The starter sends no notification, so a step asking for the permission
would be the demo step above. But removing `POST_NOTIFICATIONS` would leave a derived app failing
without knowing why — on Android 13+ a notification from an app that never asked is dropped with no
error — when the fix is only ever the ask. So the permission stays declared, the ask and the grant's
readback ship as ready helpers, and a missing grant is loud: the scheduler refuses, and says so.
Lot 11's `blockedPermissions` must never list `POST_NOTIFICATIONS`, nor `RECEIVE_BOOT_COMPLETED`,
which expo-notifications declares to re-arm scheduled triggers after a reboot.

**Sound and vibration belong to the channel, not to a setting.** A channel's sound is frozen at
creation and survives a delete-and-recreate under the same id (§11), so an in-app toggle needs a new
channel id per change, the old one deleted and every trigger scheduled again. The starter offers
none: the user sets both per channel in the system settings. An app that wants the toggle takes on
that migration knowingly.

**The paywall keeps its illustration.** bg-remover's gradient `PaywallHero` was not ported; the
starter's hero is the converter's illustration with its currencies removed, drawn for the template.
Replacing it is a design decision, not a structural one.

**The onboarding does not emit `paywall_shown`.** bg-remover counts its onboarding offer as a paywall
impression. Here `paywall_count` rides on every `purchase_completed`, and the step and the exit
sheet already have their impressions (`onboarding_step_viewed`, `onboarding_exit_intent_shown`).

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
  under lot 9; `lot == 6` alone would have missed it (§12, step 3).

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

## 9. What verification caught on lot 8

Both stages ran in the session, as on lots 6 and 7, against the three apps' sources and expo-blur's
Android implementation in `node_modules`.

- **The frieze promised a reminder nothing sends (not in the audit).** Its middle row, "Day N —
  Reminder before your trial ends", was derived from the store's trial length since lots 1–3, which
  is why the audit item read as half done. Nothing in the app schedules that reminder — nor in
  deep-focus, the reference, which carries the same row. It is gone; the frieze keeps unlock today
  and billing on the last day.
- **The onboarding sold with no price (not in the audit).** The premium step's CTA read "Start my
  7-day free trial" or "Unlock Pro", the exit sheet's "Yes, start my free trial", and neither
  surface named the price, the billing period, what the trial turns into, nor linked the terms and
  privacy policy. deep-focus has the same gap. Every button that buys now sits above the hook's
  legal note, and CLAUDE.md states it as a rule.
- **The paywall's own legal note ignored the trial.** For a trial plan it read "$29.99, renews
  automatically". It now names the trial and the period: "Free for 7 days, then $29.99/year."
- **Five of the six Pro benefits did not exist.** The audit framed the two lists as a
  consistency problem; checking each line against the code showed only "no ads" is enforced, and
  the Android-only line sold a widget the starter does not have. The comparison table's free side
  promised "Community support".
- **Seven days were promised in three more places.** The exit sheet (the audit's example), but also
  the home screen's CTA and its feature list. "Cancel in 1 tap" described no store's cancellation.
- **expo-blur samples the nearest screen, not the view below it.** Version 15 walks up to the
  nearest react-native-screens `Screen` and falls back to the activity's content view: a
  `PremiumGate` inside a native `Modal`, its own window, would blur the screen under the modal.
  The reference's comment said only that Android needs `experimentalBlurMethod`.
- **A helper the audit asked to retype had no caller.** `logOnboardingStepSkipped` and its event
  went instead: the flow has no step to skip, and one that grows a skip action adds the event with
  the name it already holds.
- **The ported layout carried two traps.** deep-focus tints the icon with `${iconColor}26`, a hex
  alpha suffix that breaks on anything but a six-digit hex, and couples the secondary label and
  handler only at runtime; the tint is an opacity layer and the pair is one `secondary` prop.

Reading the whole branch before the push found the README still describing a three-step flow
ending on a language picker, and the flow's arrows unmirrored in Arabic — the back chevron pointed
forward. Both fixed in their own commits; the code-review skill, run after them, found nothing
further.

Found along the way and left out of this lot: the home screen's feature list still says push
notifications ship with "FCM setup … and background tap handlers", false since lot 4 (lot 10 or
13); `PremiumGate` takes a `feature` prop it never reads; and deep-focus keeps the reminder row and
the priceless onboarding CTAs this lot removed here.

---

## 10. What verification caught on lot 9

Both stages ran in the session, as on lots 6 to 8, against the three apps' sources and the
libraries in `node_modules` — React Native 0.81's Android sources and Fabric's C++, zustand 5.0.8,
TanStack Query 5, react-native-google-mobile-ads 15.8.3.

- **`slotOf` is wrong under React Native's defaults (stage 1, fatal to the audit's proposal).**
  `I18nUtil.doLeftAndRightSwapInRTL` defaults to true on Android (iOS swaps too), and Fabric's
  `swapStyleLeftAndRight` turns `left` into `start` in RTL: bg-remover's physical `left: 0` anchor
  starts on the right, and its reversed index sends the indicator off the other end. The
  selector keeps its position logical and flips only its travel; `AppSwitch`'s knob, which had the
  same bare `translateX`, does the same. bg-remover's `DockRail` and `DockSegments` carry the
  pattern — left there, since it is another repository.
- **The drag-lock fix left a sheet where the finger did (stage 2).** bg-remover returns from
  `onEnd` while the lock is up: a sheet that moved before the content took the pan stayed
  displaced, and the fix depended on the lock still being up when the sheet's `onEnd` ran. The
  sheet now remembers that the content held the pan and springs back.
- **deep-focus's dialog had no gesture root (stage 1).** On Android a gesture inside a native modal
  is only recognised under a `GestureHandlerRootView` in that window: the toast the dialog hosts
  could not be swiped away. Its card was also a `Pressable`, which groups everything inside it into
  one accessibility node; a plain view stops the tap just as well, the backdrop being a sibling.
- **deep-focus's settings row announced every switch as a button (stage 1).** A `toggle` prop now
  draws the switch and carries its role and state.
- **The wheel's unit inset only worked in Arabic by accident (stage 1).** `paddingRight` landed on
  the unit's side because of the same left/right swap; it is `paddingEnd`.
- **all-currency-converter's toast comment was false here (stage 1).** Only the frontmost host
  renders a toast; the memo stands on the library's own advice, not on hidden viewports.
- **The line-height derivation is visible (stage 1).** Nine starter texts set a size from `style`;
  their lines moved, listed in the commit, as they already had in deep-focus.
- **`hook-ad-visible` had shipped with lot 5**, as `useAdPlacementActive`.
- **The query client read the app as always online (stage 1).** React Native has no `online`
  event and nothing fed `onlineManager`: retries burned through offline and `refetchOnReconnect`
  never fired. It also retried a 401 three times. `useNetworkStatus` had had no consumer since
  lots 1–3, and it tracked `offline_banner_shown` for a banner the starter does not have — the
  event is gone.
- **zustand's hydration writes only after a `migrate` (stage 1).** Read in `persistImpl`, which is
  what the documented flush rests on, with the reason its microtask is required: MMKV hydrates
  inside `create()`, before the store's binding exists.

Reading the whole branch before the push, then the code-review skill, found ten more, all fixed:

- **The centred column put the ad banner in a 600 dp box** while the anchored adaptive banner took
  the device's width: on a tablet it hung past its container, where Android delivers no touch.
  `AdBanner` passes the column's width now, and `ADS.md` states the invariant.
- **Restoring the theme's navigation bar on unmount broke two stacked forcing screens**: popping
  the top one handed the theme's style to the one still in front. Forced styles are stacked, as
  React Native stacks the status bar's.
- **`flex: 1` on the wheel overrode its height in a column**, collapsing it in a dialog or a sheet;
  `minHeight`/`maxHeight` hold it. `WHEEL_VISIBLE_ITEMS` was exported as 7 while short screens get
  5, and is private now; the wheel reads the sheet's pan from `modalSheet/contexts` directly.
- **NetInfo's unknown state read as offline** in the listener — harmless until it drove
  `onlineManager`, where it would pause every query on a connection that works.
- **A `leading-*` class lost to the derived line height**; it now wins.
- **A keyboard already up when a dialog opens was never counted**; the hook seeds from
  `Keyboard.metrics()`.
- **The docs said `/example` is called from the app**; nothing calls `exampleService` yet, and they
  say so. And a missing `BACKEND_URL` or `BACKEND_API_KEY` sent a relative request that
  `withRetry` retried as an outage; `getBackendClient()` throws by name first.

One review claim was checked and declined: that on a theme change `ThemeProvider`'s bars instance
runs after a screen's and overrides its forced style. It is `ThemeProvider`'s first child, so its
effect runs first.

Found along the way and left out of this lot: React Native reports the Android keyboard's height
above the navigation bar (`ReactRootView`: `ime.bottom − systemBars.bottom`) while an edge-to-edge
dialog window spans under it, so a dialog at its height cap can reach under the keyboard by up to a
navigation bar — not verifiable without a device; `withRetry` throws a new `Error` carrying only the
message, so a caller cannot read the status it gave up on; the onboarding is not capped on large
screens; `ModalBottomSheet`'s close button has no accessibility label (the later a11y pass); and
bg-remover's `slotOf`, above.

---

## 11. What verification caught on lot 10

Both stages ran in the session, as on lots 6 to 9, against expo-notifications 0.32.17's Android
and iOS sources, expo-modules-core's `PermissionsService`, AOSP's `PreferencesHelper`, and the two
sibling apps that schedule notifications.

- **Delete-and-recreate changes nothing (fatal to the audit's proposal).**
  `PreferencesHelper.createNotificationChannel` un-deletes a channel re-created under its old id,
  with the settings it had, and on a channel that exists applies only the name, the description,
  a group where there was none and a lower importance while the user has not touched it — never the
  sound or the vibration. all-currency-converter's `recreateRateAlertsChannel`, the reference, has
  therefore never changed anything; its switches only reach the foreground handler. Left there,
  since it is another repository.
- **The two settings had no writer.** Nothing in the starter wrote `notificationSound` or
  `notificationVibration`. Making them work takes a new channel id per change, the old one deleted
  and every trigger scheduled again — a migration, not a setting — so they went, with
  `domains/userSettings.ts`, their only reader. `shouldPlaySound: false` would also have dropped the
  heads-up banner on Android, by expo's own documentation.
- **A trigger on a missing channel is not dropped (correction to deep-focus's comment).**
  expo-notifications sends it to its own fallback channel, "Miscellaneous" (`BaseNotificationBuilder`).
  Creating the channel before scheduling is still right, for that reason.
- **A reminder with no sound is silent on iOS (not in the audit).** `Records.swift` sets
  `content.sound` only when one is given, and deep-focus's reminders and session alerts carry none.
  The scheduler sets `'default'`; deep-focus is left as it is.
- **Android reports a never-asked notification permission as `denied`.** On API 33+,
  `NotificationPermissionsModule` answers `denied` whenever `areNotificationsEnabled()` is false,
  which it is before any ask; only `canAskAgain` differs. The scheduler cannot tell a wiring bug from
  a refusal, which is why a missing grant is a warning and a breadcrumb, never a non-fatal.
- **Removing the app's flag left expo's (not in the audit).** `PermissionsService` records every
  permission it asks for in the `expo.modules.permissions.asked` shared preferences, which Auto
  Backup carries by default; recorded but not granted, a permission reads as `denied` with
  `canAskAgain` taken from `shouldShowRequestPermissionRationale` — false where nothing was ever
  asked. On a restored phone every runtime permission would have sent the user to the settings
  instead of the dialog. The file is out of the backup rules.
- **Two overlapping syncs duplicated the reminders (not in the audit).** deep-focus's sync cancels,
  then schedules, with nothing ordering two calls; an effect firing twice cancels twice and
  schedules twice. The starter's calls are queued.
- **deep-focus's session-alert ask is guarded by the backed-up flag.** `requestSessionAlertPermission`
  asks only while `NOTIFICATION_PERMISSION_REQUESTED` is unset — on a restored phone, never. Left
  there.
- **An item filed under another lot.** `claude-notification-permission` sits under lot 13.

Found along the way and fixed in their own commits: `pnpm lint` had failed on `main` since 5542d78
left a line Prettier rejects, and the CHANGELOG still listed the onboarding's old third step.

Reading the whole branch, then the code-review skill on the pull request, found five more, all
fixed:

- **A native failure rejected into an effect that never waits.** The sync resolves `'failed'` with a
  non-fatal instead.
- **A time out of range left the group half scheduled.** expo validates a daily trigger one call at
  a time (`validateDateComponentsInTrigger`), after the group had been cancelled; every entry is
  checked first now.
- **iOS reports a provisional or ephemeral authorisation as `undetermined`.** The general status is
  `granted` for `UNAuthorizationStatusAuthorized` only; `isGranted` reads `ios.status` too.
- **The hook's reading could outlive a request.** One started before `request()` could land after it
  and put the old grant back, and a failed one was an unhandled rejection; readings take a ticket.
- **The docs let a regained grant go unsynced.** A sync without the grant empties the group, and the
  natural caller, an effect keyed on the list, never re-runs when the grant comes back; the effect
  depends on the grant too. The same paragraph credited `RECEIVE_BOOT_COMPLETED` with the re-arming
  after an update, which is `MY_PACKAGE_REPLACED`'s and needs no permission.

Declined, each with its reason on the record: fixed identifiers instead of the `data` marker
(`mapNotificationRequest` parses Android's `dataString` back into `data`, which deep-focus relies
on); creating the channel once instead of at each sync (an MMKV read and one native call, which also
keep its name in the current language); stripping the two dropped settings from what `persist`
holds (the starter has no installs, §4); a timeout on the queue (expo's native calls settle, and a
call timed out but still running would race the next sync, which is what the queue prevents).

---

## 12. Resuming in a new session

1. Read this file, then `CLAUDE.md` at the repo root.
2. `git log --oneline origin/main..HEAD` — that is the real unpushed gap.
3. Pick the lot. Pull its items, then search the other lots for items on the same files — the
   audit filed some under a neighbouring lot:
   ```bash
   python3 -c "import json;d=json.load(open('docs/boilerplate-audit/audit-items.json'));\
   print(json.dumps([x for x in d if x['lot']==11 and x['decision']=='keep' and x['status']=='todo'],ensure_ascii=False,indent=1))"
   ```
4. Run the verify-then-refute workflow over the lot's items grouped into families (§2).
5. Apply, one commit per subject, `pnpm typecheck` and `pnpm lint` green each time.
6. Update `status` in `audit-items.json` for what shipped (`done-lotN`, in every copy of an item the
   audit filed twice), then the `ITEMS` line of `audit-console.html`, which embeds its own copy of
   the data, and its `SHIPPED_LOT` map, which must learn the new status; then this file's §1 table.
7. Push the branch, open the pull request, review it, fix what the review finds, and merge.
