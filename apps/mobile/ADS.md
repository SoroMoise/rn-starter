# Advertising — RN Starter

Everything the app shows as an ad: where each surface lives, which AdMob unit it uses, how often it
fires, and what it must never do. `CLAUDE.md` and `PROJECT_CONTEXT.md` summarise this; **this file
is the reference** — keep it in sync with `constants/admob.ts` in the same change as any surface,
unit or frequency.

Ads exist for free users only. A subscription (`isPremium`), the rewarded ad-free window
(`isAdFreeActive`), an unresolved UMP consent and a Firebase Test Lab device each suppress every
surface below.

---

## 1. Inventory

One AdMob unit per placement, never shared: AdMob reports revenue **by unit**, so two surfaces on
one unit are a single revenue line nobody can split afterwards.

| # | Placement | Surface | Format | Constant | Unit | Status |
|---|-----------|---------|--------|----------|------|--------|
| 1 | Home | `app/(tabs)/index.tsx`, pinned above the tab bar | Banner (anchored adaptive) | `ADMOB_INDEX_BANNER_ID` | pending | mounted |
| 2 | Settings | `app/(tabs)/settings.tsx`, pinned above the tab bar | Banner (anchored adaptive) | `ADMOB_SETTINGS_BANNER_ID` | pending | mounted |
| 3 | Any value moment | `useActionRating().recordAction()` | Interstitial | `ADMOB_INTERSTITIAL_ID` | pending | wired to the Home demo action |
| 4 | Settings → Ads | `RewardedAdButton`, placement `settings` | Rewarded | `ADMOB_REWARDED_ID` | pending | mounted |

A rewarded surface is a `RewardedPlacement` with its own unit: `rewardedAdService` keeps one
preloaded ad per unit and addresses it by placement. A second one takes a new member of
`RewardedPlacement`, its own `ADMOB_*_REWARDED_ID` in `constants/admob.ts`, one entry in
`UNIT_BY_PLACEMENT` and a row in the inventory above — never an existing unit.

### Units

Every unit ships as `UNIT_PENDING` (`null`). `pickUnitId` resolves a pending unit — and an empty
id, or a `XXXX` placeholder pasted from a template — to `null`, and every surface reads `null` as
"request nothing": the banner does not render and the services do not initialise. The Settings
"Remove ads" section appears only where a video can be served — kill switch, configured unit, the
store's answer and the tier, consent, environment — rather than offering one that can never load;
the ad-free window does not hide it, since the section answers that itself with the time left
(§3). In `__DEV__` all placements resolve to Google's `TestIds` regardless, so layouts and flows
are testable without a real unit.

### Before the first release

1. Replace Google's sample **app ids** in `app.config.js` (the `react-native-google-mobile-ads`
   plugin block) with the app's own — the SDK crashes at launch without one, which is why the
   template ships the sample ones rather than nothing. The release workflow refuses to publish
   while the Android one is still Google's, and warns while every Android unit is still pending.
2. Create one unit per placement in the AdMob console and paste each into `constants/admob.ts`.
   A placement with no unit stays `UNIT_PENDING`; never lend it another placement's unit.
3. Update the inventory above.

---

## 2. Cadence — what an action earns

The interstitial is the only interruptive ad, and `recordAction()` is its only caller. Each call:

```
recordAction({ allowPromos })
  │
  ├─ engagementStorage.incrementAction()     (lifetime counter, +1, always)
  ├─ allowPromos: false ─────────────────────► stop
  ├─ contextual paywall takes the moment ───► stop
  ├─ allowInterstitial: false ──────────────► skip the ad
  ├─ session's interruption already spent ──► skip the ad
  ├─ ad-free window open ───────────────────► skip the ad
  ├─ AdService.recordExecution()             (actions since the last ad, +1)
  ├─ shouldShowInterstitialAd() ────────────► show it; stop if it was seen
  └─ arm the rating ask                      (raised once the user is back — CLAUDE.md, App Rating)
```

`shouldShowInterstitialAd()` says yes only when all of these hold:

- the format is enabled and the user is not a subscriber;
- the session's automatic interruption is unspent and no other surface is up (`promoCoordinator`);
- consent allows requests, and an ad is loaded;
- at least `INITIAL_EXECUTIONS_THRESHOLD` (4) actions since the last ad during the first
  `INTERSTITIAL_RAMP_UP_DAYS` (7) days after install, `PROGRESSIVE_EXECUTIONS_THRESHOLD` (2) after;
- at least `MIN_INTERVAL_MS` (90 s) since the last ad.

With one interruption per session, the thresholds decide how far into a session its interruption
can come, and the interval only matters across a quick relaunch.

Rules that follow, and that the code enforces:

- **One automatic interruption per session, all types included.** The contextual paywall, the
  interstitial and the rating ask share one budget; a session that had its contextual paywall
  gets no interstitial, and the other way round. A paywall the user opens spends nothing. The
  order is paywall, then interstitial, then rating — which an action only arms: the ask is raised
  when the user comes back, and never within two minutes of an interstitial
  (`REVIEW_REQUEST_CONFIG.adQuietSeconds`).
- **A slot is spent on what the user actually saw.** `showInterstitialAd()` resolves on `CLOSED`,
  not on the native `show()` — which resolves the moment the ad is handed to the activity. Only a
  closed ad resets the counter, stamps the interval, spends the session's interruption and takes
  the action's moment; one that errored or never opened leaves them untouched, and the moment
  still arms the rating ask.
- **An ad that never opens does not hold anything.** On Android the library never reports a failed
  presentation (`onAdFailedToShowFullScreenContent` is not handled), so `presentFullScreenAd`
  settles as `never_opened` when no `OPENED` arrives within `PRESENTATION_TIMEOUT_MS` and the
  coordinator's flag comes down. That instance is replaced, as is any whose presentation failed:
  the library still counts it as loaded and would refuse to reload it.
- **An ad that opens late still pays what it owes.** `onEnd` runs whenever a presentation really
  ends, past the deadline included, so a late interstitial still spends its slot and the session's
  interruption — or the next action could show a second one — and a late rewarded video still
  earns its window.
- **Moments that must not be interrupted still count.** `recordAction({ allowPromos: false })`
  moves the lifetime counter and nothing else — for the user's first success and for an abandoned
  or failed action. It does not advance the interstitial's own counter either, and neither does an
  action taken once the session's interruption is spent: that counter measures actions that could
  have gone to an ad, so a new session never opens on an ad the last one ran up.
- **A moment can take the paywall and refuse the ad.** `recordAction({ allowInterstitial: false })`
  is for an action the user repeats inside a flow — a reading just logged, an item just added —
  where an interstitial is the interruption reviews punish: the contextual paywall may still take
  the moment, the ad never does, and the ad's own counter does not move.
- **The counters are persisted** (MMKV), so killing the app between two actions buys nothing.

---

## 3. The rewarded offer

A rewarded video is an **offer, never an autoplay**: the user starts it from Settings → Ads, and
the button names the reward before anything plays (`settings.watchAdButton`).

- The section appears only where a video can be served: `AdFreeSection` renders from
  `useCanServeAd` — kill switch, configured unit, the store's answer and the tier, consent,
  environment. Anywhere else its button could only say that no ad is available, and before the
  store has answered a subscriber would see the offer flash. The ad-free window is the one gate it
  leaves out: the section answers it itself, the button showing the time left.
- Reward: `AD_REWARDED_FREE_DURATION_MINUTES` (60) of no ads, added to whatever is left of an open
  window and capped at `AD_REWARDED_FREE_MAX_MINUTES` (a day) — `AdFreeProvider.activateAdFreeReward`.
  While a window is open the button shows the time left instead of another offer.
- The window suppresses every ad surface: banners through `useAdPlacementActive`, the interstitial
  through `recordAction`. It buys no ads and nothing else — it opens no premium feature.
- `RewardedAdService.show({ placement, onRewarded })` resolves `earned`, `dismissed` or `failed`.
  Only `dismissed` — a video closed before its reward — is followed by the contextual paywall
  (`rewarded_ad_dismissed`, 800 ms later). A video watched in full is never followed by a sale, and
  a failure is not a refusal.
- Readiness is checked before the video starts: nothing loaded ⇒ "Ad not available", not an offer
  that cannot be honoured. A video that failed to open shows the error alert; if it opens after
  all and is watched in full, the window is still granted.

---

## 4. Gates every ad passes

| Gate | Where | Effect |
|------|-------|--------|
| Kill switch | `AD_*_ENABLED` in `constants/admob.ts` | placement off entirely |
| Unit exists | `UNIT_PENDING` → `null` | placement silent, no request |
| Environment | `adsAllowedInEnvironment()` (`services/api/adEnvironment.ts`) | nothing is requested on a Firebase Test Lab device |
| Tier | `isPremium` (RevenueCat), mirrored into `AdService.setPremium` by `SubscriptionProvider` | no ads at all; a purchase mid-process drops a preloaded interstitial and its pending retries |
| Ad-free window | `isAdFreeActive` | no ads while it lasts |
| UMP consent | `consentService.canRequestAds()` — at init **and** at show time | nothing reaches the EEA/UK/CH without the form; the state can change after init |
| On screen | `useStageActive()` in `AdBanner` | a blurred or backgrounded screen unmounts its banner |

`useAdPlacementActive` (`hooks/useAdPlacementActive.ts`) is the single React-side answer to the
first six for a banner. `AdBanner` renders from it and its screen reserves `AD_BANNER_RESERVED_HEIGHT`
from the same call, so the room kept free below the last row always matches the banner actually
drawn. It is `useCanServeAd` (`hooks/useCanServeAd.ts`) plus the ad-free window: the rewarded
section renders from `useCanServeAd` alone, since it stays up through the window to show the time
left.

---

## 5. Constants to tune

`constants/admob.ts` — literals rather than `.env`: they ship in the bundle whatever route they
take, and an incomplete env silently shipped a sibling app's release with no ads.

| Constant | Value | Meaning |
|----------|-------|---------|
| `ADMOB_*_ID` | `UNIT_PENDING` | one unit per placement (§1) |
| `AD_BANNER_INDEX_ENABLED` / `AD_BANNER_SETTINGS_ENABLED` | `true` | per-banner kill switch |
| `AD_INTERSTITIAL_ENABLED` / `AD_REWARDED_ENABLED` | `true` | format kill switches |
| `AD_REWARDED_FREE_DURATION_MINUTES` | `60` | ad-free window a completed video grants |
| `AD_REWARDED_FREE_MAX_MINUTES` | `1440` | ceiling on the accumulated window |
| `AD_BANNER_RESERVED_HEIGHT` | `60` | room a screen keeps below its last row while its banner shows |
| `AD_NON_PERSONALIZED_ONLY` | `false` | every request asks for non-personalized ads only (`AD_REQUEST_OPTIONS`) — `true` for an app whose audience a health or other sensitive condition defines |

`services/api/adService.ts` — the interstitial cadence (§2): `INITIAL_EXECUTIONS_THRESHOLD` (4),
`PROGRESSIVE_EXECUTIONS_THRESHOLD` (2), `INTERSTITIAL_RAMP_UP_DAYS` (7), `MIN_INTERVAL_MS` (90 s).
`services/api/fullScreenAd.ts` — `PRESENTATION_TIMEOUT_MS` (10 s).

---

## 6. Storage

The cadence counters live in the main MMKV instance (`services/storage/domains/ads.ts`). The ad-free
window grants something, so it lives in the encrypted entitlement instance (`services/storage/secure.ts`,
`domains/adFree.ts`), which no backup or device transfer carries.

| Key | Constant | Holds |
|-----|----------|-------|
| `@ad_execution_count` | `KEYS.AD_EXECUTION_COUNT` | actions offered to the interstitial since the last one was seen |
| `@ad_last_shown` | `KEYS.AD_LAST_SHOWN` | timestamp of the last interstitial seen, for the interval floor |
| `@ad_free_until` | `KEYS.AD_FREE_UNTIL` | end of the rewarded ad-free window (encrypted instance) |

The session's interruption budget and the visible surfaces are in memory (`promoCoordinator`),
reset at every launch.

---

## 7. Analytics

| Event | Params | Fired from |
|-------|--------|-----------|
| `rewarded_ad_result` | `result: completed \| dismissed \| failed`, `ad_free_duration_minutes` | `RewardedAdButton` |
| `ad_privacy_options_opened` | — | Settings → Ad privacy row (`LegalSupportSection`) |

---

## 8. Code map

| File | Responsibility |
|------|----------------|
| `constants/admob.ts` | unit ids, kill switches, reward constants — the only place any of them appear |
| `app.config.js` | the AdMob app ids (plugin block); the consent test aid (`extra.consentDebug`) |
| `.github/workflows/release-android.yml` | refuses a release that still carries Google's sample app id, warns when no unit is configured |
| `plugins/withReleaseEnvGuard.js` | a release build, local or CI, refuses a consent test aid (`scripts/check-release-env.js`) |
| `services/api/consentService.ts` | the UMP gate; the only caller of `mobileAds().initialize()`; under `__DEV__` it reads the consent test aid (§10) |
| `services/api/adEnvironment.ts` | no request from a Firebase Test Lab device |
| `modules/app-environment/` | the native side of it — reads the `firebase.test.lab` system setting |
| `services/api/adService.ts` | interstitial: preload, cadence, show; `setPremium` |
| `services/api/rewardedAdService.ts` | rewarded: one preloaded ad per unit, addressed by placement; `show` resolves `earned` / `dismissed` / `failed` |
| `services/api/fullScreenAd.ts` | `presentFullScreenAd` — settles a full-screen ad once it is gone |
| `services/api/adFailures.ts` | `reportAdFailure` — a failed load or show, sorted by its code: the two services' loads, `presentFullScreenAd`'s show and its deadline, `AdBanner`'s load |
| `services/promo/promoCoordinator.ts` | no stacking, one automatic interruption per session |
| `hooks/useActionRating.ts` | the action chain: counter, then paywall, interstitial, and the rating ask armed |
| `hooks/useAdPlacementActive.ts` | may this placement run right now — `useCanServeAd` plus the ad-free window |
| `hooks/useCanServeAd.ts` | can an ad be served here at all — every gate but the ad-free window |
| `components/ads/AdBanner.tsx` | the banner, pinned above the tab bar |
| `components/ads/RewardedAdButton.tsx` | the Settings rewarded entry point |
| `components/settings/AdFreeSection.tsx` | the Settings "Remove ads" section, rendered only where a video can be served |
| `providers/AdFreeProvider.tsx` | the ad-free window: grant, accumulate, expire |

---

## 9. Invariants

Deliberate and load-bearing — don't undo them without a reason written down here:

- **No ad may be requested before `consentService.canRequestAds()`.** Not "hidden" — *not
  requested*. Check it **at show time too**, not only at init: the consent state can change after
  the SDK started — the privacy form stays reachable from Settings — and by then an ad is long
  preloaded.
- **No ad is requested on a Firebase Test Lab device.** Play's pre-launch report crawls every upload
  and taps whatever is interactive, ad views included; those devices carry no test-device identity,
  so every impression and click they produce is billed as invalid traffic.
- **A banner is mounted once per visit, never rebuilt by a toggle inside the screen.** It lives
  outside whatever conditional owns the bottom of the screen: the mount/unmount cycle *is* the ad
  request cycle, and one per open-and-close of a panel is impression inflation, which AdMob reads as
  invalid traffic. It cost bg-remover's AdMob account a 29-day suspension on 2026-08-26.
- **A banner the user cannot see is unmounted, not hidden.** `useStageActive()` (focus +
  foreground) gates every one: a stack keeps the screens under the top one mounted, and a
  zero-height or covered `AdView` keeps requesting — only unmounting stops it.
- **A pending unit renders nothing.** Don't paper over a missing id with another placement's unit:
  it destroys the per-placement revenue reporting this file exists to protect.
- **Unit ids stay literals, never `.env`.** They are public by construction (the app id ships in
  the manifest, every unit id in the bundle's string table); `.env` protected nothing and made an
  incomplete env ship a release with no ads, no error and no revenue.
- **One automatic interruption per session, all types included**, in the order paywall,
  interstitial, rating. Don't flip it to show the ad sooner: the paywall is the surface that earns.
- **Whatever follows an ad waits for it to close.** Never sequence on the native `show()`, and
  never leave the coordinator's interstitial flag raised: every exit path of
  `showInterstitialAd()` lowers it, or no automatic promo would run again that session.
- **Every request carries `AD_REQUEST_OPTIONS`** — the banner, the interstitial and the rewarded
  video alike. Google's publisher policies forbid personalizing ads on health or other sensitive
  information, and in an app whose audience such a condition defines (a blood-pressure log, a
  diabetes diary) using the app is that information: it sets `AD_NON_PERSONALIZED_ONLY`, whatever
  the consent form allowed. A request built without the options would personalize anyway.
- **No rewarded autoplay.** It is an AdMob policy breach and reads as a bait ad.
- **Never chain an interstitial onto a declined rewarded video.** The user answered.
- **A banner fits the column it sits in.** An anchored adaptive banner is as wide as the device
  unless given a `width`. On a tablet or an open foldable, `ScreenContainer` caps its content at a
  600 dp column, and a device-wide ad hangs past its container — where Android delivers no touch,
  a partly dead ad. `AdBanner` passes the column's width, `min(MAX_CONTENT_WIDTH, window − side
  insets)`, which on a phone is the device's own.
- **A banner never sits flush against a tappable control.** A finger that misses the control and
  lands on the ad is a mis-tap, which AdMob counts as an invalid click — the screen reserves
  `AD_BANNER_RESERVED_HEIGHT` below its last row.
- **Call `recordAction` where the screen has settled.** An interstitial presented while a
  transition is still sliding in under the finger that triggered it collects the tail of that
  gesture as a click.
- **A failure is sorted by its code, and only the unexpected is a non-fatal** — the purchase rule,
  applied to ads. Every failed load or show goes through `reportAdFailure({ error, source })`: no
  fill, a network, server or timeout failure, an internal error, an OS too old and nothing to
  present into (`null-activity`, `nil-vc`) are conditions, a Crashlytics breadcrumb each; anything
  else — a wrong unit id, a missing app id, an ad the library does not hold, a presentation that
  never opened — is a non-fatal. Most failed loads are no-fills: recorded as crashes they would
  bury the wrong unit id that serves nothing without an error anywhere, and a `console.warn`
  reaches no release. Sort on the code, never on the message.
- **The consent test aid is a development build's, and nothing else's** (steps in §10). `UMP_DEBUG_GEOGRAPHY` and
  `UMP_TEST_DEVICE_IDS` (`.env`, through `app.config.js` `extra`) are read by `consentService` under
  `__DEV__` only: a release neither simulates a region nor registers a test device, whatever its
  config holds, and a release build refuses to start with either set, local or CI (`withReleaseEnvGuard`).

---

## 10. Testing

`__DEV__` resolves every placement to Google's `TestIds`, so the full flow runs on a debug build
with no AdMob account involved and no risk to the publisher account:

1. Finish the onboarding on a fresh install — the consent form appears first where the law
   requires one. Home and Settings each show a **test banner** above the tab bar, and the last row
   of each still scrolls clear of it.
2. Tap **Perform a sample action** on Home four times → a **test interstitial** on the fourth. Keep
   tapping: nothing else interrupts for the rest of the session, neither another ad nor the
   paywall nor the rating prompt.
3. Relaunch → the next interstitial needs four more actions and 90 s since the last one.
4. Settings → Ads → watch the test video to the end → the banner disappears and the button shows
   the time left; no paywall follows. Once the window has run out, start another video and close it
   early → the contextual paywall may follow 0.8 s later (from the second session, past ten
   actions, with an offer loaded) — never after a video watched in full.
5. Subscribe (sandbox) mid-session → both banners go, the interstitial never shows again, and
   Home's premium CTA disappears.

### The consent form from outside the EEA

The form only appears where the law requires it, and UMP geolocates by IP. On a development build,
two variables of `apps/mobile/.env` (see `.env.example`) bring it up from anywhere:

1. Run the debug build once with `UMP_TEST_DEVICE_IDS` empty and finish the onboarding, then read
   the phone's hashed id in the log: `adb logcat | grep -i "addTestDeviceHashedId"` — UMP prints
   *Use new ConsentDebugSettings.Builder().addTestDeviceHashedId("…") to set this as a debug device*.
   The id is 32 hexadecimal characters.
2. Put it in `.env` as `UMP_TEST_DEVICE_IDS=<id>` (several, comma-separated) and set
   `UMP_DEBUG_GEOGRAPHY=EEA`, then restart the dev server with a cleared cache — the values travel
   through `app.config.js` `extra`, read when Metro starts.
3. The form is shown once and its answer is kept: clear the app's data (or reinstall) to see it
   again, and finish the onboarding to reach the point where it is gathered. With it answered,
   Settings shows *Ad privacy settings* (`arePrivacyOptionsRequired`).

The debug geography only applies to a registered test device, and both variables are ignored in a
release build (§9). Test ads still resolve to `TestIds` in `__DEV__`; the real units and the
published messages are only verified on a build from the internal track.
