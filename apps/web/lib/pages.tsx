import type { Metadata } from 'next'
import { JsonLd } from '@/components/JsonLd'
import { LegalDocumentView } from '@/components/LegalDocumentView'
import { SiteShell } from '@/components/SiteShell'
import { getLegalContent, getSiteContent } from '@/content'
import type { Locale } from './i18n'
import { homeJsonLd } from './jsonLd'
import { buildMetadata } from './seo'
import { SITE, STORE_URL } from './site'

type LegalRoute = 'privacy' | 'terms'

export function homeMetadata(locale: Locale): Metadata {
  const t = getSiteContent(locale)
  return buildMetadata({
    locale,
    route: 'home',
    title: t.home.title,
    description: t.home.description,
  })
}

export function HomePage({ locale }: { locale: Locale }) {
  const t = getSiteContent(locale)

  return (
    <SiteShell locale={locale} route="home">
      <section className="hero">
        <h1>{SITE.name}</h1>
        <p className="tagline">{t.home.tagline}</p>
        <p>{t.home.body}</p>
        <a className="cta" href={STORE_URL}>
          {t.home.storeCta}
        </a>
      </section>
      <JsonLd data={homeJsonLd(locale)} />
    </SiteShell>
  )
}

export function legalMetadata({ locale, route }: { locale: Locale; route: LegalRoute }): Metadata {
  const document = getLegalContent(locale)[route]
  return buildMetadata({
    locale,
    route,
    title: `${document.title} — ${SITE.name}`,
    description: document.description,
  })
}

export function LegalPage({ locale, route }: { locale: Locale; route: LegalRoute }) {
  return (
    <SiteShell locale={locale} route={route}>
      <LegalDocumentView locale={locale} document={getLegalContent(locale)[route]} />
    </SiteShell>
  )
}
