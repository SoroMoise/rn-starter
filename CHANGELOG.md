# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Initial template

### Added

- Expo SDK 54 + Expo Router monorepo (pnpm + Turborepo): `apps/mobile`, `apps/api`, `packages/shared`.
- Theme system (light/dark + RTL) with NativeWind v4 and a design-system component set.
- Internationalization with i18next — 20 languages, lazy-loaded, EN/FR as source of truth.
- Monetization: RevenueCat paywall with a contextual paywall driven by a generic action counter, AdMob (banner/interstitial/rewarded), and an app-store rating prompt.
- Scheduled local reminders backed by the notifications engine (FCM-ready).
- Onboarding flow (welcome → premium → language) and a premium demo home screen.
- Generic Cloudflare Worker API (`/health` + an authenticated example route + an FCM push helper).
- Template tooling: `scripts/setup.sh`, environment and Firebase config templates.
