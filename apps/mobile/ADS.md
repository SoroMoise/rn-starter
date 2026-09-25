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
| 1 | Home | `app/index.tsx` | Banner (anchored adaptive) | `ADMOB_INDEX_BANNER_ID` | pending | declared, not mounted |
| 2 | Settings | `app/settings.tsx`, pinned above the tab bar | Banner (anchored adaptive) | `ADMOB_SETTINGS_BANNER_ID` | pending | mounted |
| 3 | Any value moment | `useActionRating().recordAction()` | Interstitial | `ADMOB_INTERSTITIAL_ID` | pending | wired to the Home demo action |
| 4 | Settings → Ads | `RewardedAdButton` | Rewarded | `ADMOB_REWARDED_ID` | pending | mounted |

### Units

Every unit ships as `UNIT_PENDING` (`null`). `pickUnitId` resolves a pending unit — and an empty
id, or a `XXXX` placeholder pasted from a template — to `null`, and every surface reads `null` as
"request nothing": the banner does not render, the services do not initialise, and the Settings
"Remove ads" section disappears rather than offering a video that can never load. In `__DEV__` all
placements resolve to Google's `TestIds` regardless, so layouts and flows are testable without a
real unit.

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
  ├─ session's interruption already spent ──► skip the ad (and the rating after it)
  ├─ ad-free window open ───────────────────► skip the ad
  ├─ AdService.recordExecution()             (actions since the last ad, +1)
  ├─ shouldShowInterstitialAd() ────────────► show it, then stop — shown or not
  └─ rating prompt, if eligible
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
  interstitial and the rating prompt share one budget; a session that had its contextual paywall
  gets no interstitial, and the other way round. A paywall the user opens spends nothing. The order is paywall, then interstitial, then rating.
- **A slot is spent on what the user actually saw.** `showInterstitialAd()` resolves on `CLOSED`,
  not on the native `show()` — which resolves the moment the ad is handed to the activity. Only a
  closed ad resets the counter, stamps the interval and spends the session's interruption; one that
  errored or never opened leaves them untouched.
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
- **The counters are persisted** (MMKV), so killing the app between two actions buys nothing.

---

## 3. The rewarded offer

A rewarded video is an **offer, never an autoplay**: the user starts it from Settings → Ads, and
the button names the reward before anything plays (`settings.watchAdButton`).

- Reward: `AD_REWARDED_FREE_DURATION_MINUTES` (60) of no ads, added to whatever is left of an open
  window and capped at `AD_REWARDED_FREE_MAX_MINUTES` (a day) — `AdFreeProvider.activateAdFreeReward`.
  While a window is open the button shows the time left instead of another offer.
- The window suppresses every ad surface: banners through `useAdPlacementActive`, the interstitial
  through `recordAction`. It buys no ads and nothing else — it opens no premium feature.
- `showRewardedAd` resolves `earned`, `dismissed` or `failed`. Only `dismissed` — a video closed
  before its reward — is followed by the contextual paywall (`rewarded_ad_dismissed`, 800 ms
  later). A video watched in full is never followed by a sale, and a failure is not a refusal.
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
drawn.

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

`services/api/adService.ts` — the interstitial cadence (§2): `INITIAL_EXECUTIONS_THRESHOLD` (4),
`PROGRESSIVE_EXECUTIONS_THRESHOLD` (2), `INTERSTITIAL_RAMP_UP_DAYS` (7), `MIN_INTERVAL_MS` (90 s).
`services/api/fullScreenAd.ts` — `PRESENTATION_TIMEOUT_MS` (10 s).

---

## 6. Storage

Plain MMKV (`services/storage/domains/`).

| Key | Constant | Holds |
|-----|----------|-------|
| `@ad_execution_count` | `KEYS.AD_EXECUTION_COUNT` | actions offered to the interstitial since the last one was seen |
| `@ad_last_shown` | `KEYS.AD_LAST_SHOWN` | timestamp of the last interstitial seen, for the interval floor |
| `@ad_free_until` | `KEYS.AD_FREE_UNTIL` | end of the rewarded ad-free window |

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
| `app.config.js` | the AdMob app ids (plugin block) |
| `.github/workflows/release-android.yml` | refuses a release that still carries Google's sample app id, warns when no unit is configured |
| `services/api/consentService.ts` | the UMP gate; the only caller of `mobileAds().initialize()` |
| `services/api/adEnvironment.ts` | no request from a Firebase Test Lab device |
| `modules/app-environment/` | the native side of it — reads the `firebase.test.lab` system setting |
| `services/api/adService.ts` | interstitial: preload, cadence, show; `setPremium` |
| `services/api/rewardedAdService.ts` | rewarded: preload, show, `earned` / `dismissed` / `failed` |
| `services/api/fullScreenAd.ts` | `presentFullScreenAd` — settles a full-screen ad once it is gone |
| `services/promo/promoCoordinator.ts` | no stacking, one automatic interruption per session |
| `hooks/useActionRating.ts` | the action chain: counter, then paywall, interstitial, rating |
| `hooks/useAdPlacementActive.ts` | may this placement run right now |
| `components/ads/AdBanner.tsx` | the banner, pinned above the tab bar |
| `components/ads/RewardedAdButton.tsx` | the Settings rewarded entry point |
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
- **No rewarded autoplay.** It is an AdMob policy breach and reads as a bait ad.
- **Never chain an interstitial onto a declined rewarded video.** The user answered.
- **A banner never sits flush against a tappable control.** A finger that misses the control and
  lands on the ad is a mis-tap, which AdMob counts as an invalid click — the screen reserves
  `AD_BANNER_RESERVED_HEIGHT` below its last row.
- **Call `recordAction` where the screen has settled.** An interstitial presented while a
  transition is still sliding in under the finger that triggered it collects the tail of that
  gesture as a click.

---

## 10. Testing

`__DEV__` resolves every placement to Google's `TestIds`, so the full flow runs on a debug build
with no AdMob account involved and no risk to the publisher account:

1. Finish the onboarding on a fresh install — the consent form appears first where the law
   requires one. Settings shows a **test banner** above the tab bar, and its last row still
   scrolls clear of it.
2. Tap **Perform a sample action** on Home four times → a **test interstitial** on the fourth. Keep
   tapping: nothing else interrupts for the rest of the session, neither another ad nor the
   paywall nor the rating prompt.
3. Relaunch → the next interstitial needs four more actions and 90 s since the last one.
4. Settings → Ads → watch the test video to the end → the banner disappears and the button shows
   the time left; no paywall follows. Once the window has run out, start another video and close it
   early → the contextual paywall may follow 0.8 s later (from the second session, past ten
   actions, with an offer loaded) — never after a video watched in full.
5. Subscribe (sandbox) mid-session → the banner goes, the interstitial never shows again, and
   Home's premium CTA disappears.
