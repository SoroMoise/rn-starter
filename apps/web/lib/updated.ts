import { getContent } from '@/content'
import { ISO_DATE, type Locale } from './i18n'
import { GUIDE_KEYS, isGuide, isLegal } from './pageTree'
import type { RouteKey } from './routes'
import { SITE } from './site'

export function newestGuide(locale: Locale): string | undefined {
  const { guides } = getContent(locale)
  return GUIDE_KEYS.map((key) => guides[key].updated)
    .filter((date) => ISO_DATE.test(date))
    .sort()
    .at(-1)
}

export function lastModified({
  route,
  locale,
}: {
  route: RouteKey
  locale: Locale
}): string | undefined {
  if (isGuide(route)) return getContent(locale).guides[route].updated
  if (route === 'guides') return newestGuide(locale)
  if (isLegal(route) && ISO_DATE.test(SITE.legalUpdated)) return SITE.legalUpdated
  return undefined
}
