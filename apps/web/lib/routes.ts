import type { Locale } from './i18n'

export const ROUTES = {
  home: { en: '/', fr: '/fr' },
  privacy: { en: '/privacy', fr: '/fr/privacy' },
  terms: { en: '/terms', fr: '/fr/terms' },
} as const satisfies Record<string, Record<Locale, string>>

export type RouteKey = keyof typeof ROUTES
