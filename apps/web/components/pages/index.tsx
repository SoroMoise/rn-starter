import type { Metadata } from 'next'
import { getContent, pageInfo } from '@/content'
import type { Locale } from '@/lib/i18n'
import { isGuide, isHub, isLegal, isTopic } from '@/lib/pageTree'
import type { RouteKey } from '@/lib/routes'
import { buildMetadata } from '@/lib/seo'
import { AboutPage } from './AboutPage'
import { FaqPage } from './FaqPage'
import { FeaturesPage } from './FeaturesPage'
import { GuidePage } from './GuidePage'
import { HomePage } from './HomePage'
import { HubPage } from './HubPage'
import { LegalPage } from './LegalPage'
import { PricingPage } from './PricingPage'
import { TopicPage } from './TopicPage'

export function pageMetadata({ locale, route }: { locale: Locale; route: RouteKey }): Metadata {
  const { meta } = pageInfo({ key: route, locale })
  const guide = isGuide(route) ? getContent(locale).guides[route] : undefined
  return buildMetadata({
    locale,
    route,
    ...meta,
    article: guide ? { published: guide.published, updated: guide.updated } : undefined,
  })
}

export function SitePage({ locale, route }: { locale: Locale; route: RouteKey }) {
  if (isTopic(route)) return <TopicPage locale={locale} route={route} />
  if (isHub(route)) return <HubPage locale={locale} route={route} />
  if (isGuide(route)) return <GuidePage locale={locale} route={route} />
  if (isLegal(route)) return <LegalPage locale={locale} route={route} />
  switch (route) {
    case 'home':
      return <HomePage locale={locale} />
    case 'features':
      return <FeaturesPage locale={locale} />
    case 'pricing':
      return <PricingPage locale={locale} />
    case 'faq':
      return <FaqPage locale={locale} />
    case 'about':
      return <AboutPage locale={locale} />
  }
}
