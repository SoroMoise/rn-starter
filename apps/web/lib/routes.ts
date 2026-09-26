import type { Locale } from './i18n'

// The URL of every page in every locale. The header, the footer, the language link, the hreflang
// alternates and the sitemap all read this table, so a page cannot move in one place and be left
// behind in another. English sits at the root, French under /fr.
//
// The legal pages keep one slug in every locale — never /fr/confidentialite. Every installed build
// opens /privacy and /terms, whatever its language, and a moved path is a dead link beside the
// paywall's buy button in a release no later fix can reach.
export const ROUTES = {
  home: { en: '/', fr: '/fr' },
  privacy: { en: '/privacy', fr: '/fr/privacy' },
  terms: { en: '/terms', fr: '/fr/terms' },
} as const satisfies Record<string, Record<Locale, string>>

export type RouteKey = keyof typeof ROUTES
