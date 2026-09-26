import Link from 'next/link'
import type { ReactNode } from 'react'
import { getSiteContent } from '@/content'
import { HTML_LANG, LOCALE_LABEL, LOCALES, type Locale } from '@/lib/i18n'
import { ROUTES, type RouteKey } from '@/lib/routes'
import { SITE } from '@/lib/site'

export function SiteShell({
  locale,
  route,
  children,
}: {
  locale: Locale
  route: RouteKey
  children: ReactNode
}) {
  const t = getSiteContent(locale)

  return (
    <>
      <header className="site-header">
        <Link href={ROUTES.home[locale]} className="site-name">
          {SITE.name}
        </Link>
        <nav aria-label={LOCALE_LABEL[locale]}>
          {LOCALES.filter((other) => other !== locale).map((other) => (
            <Link
              key={other}
              href={ROUTES[route][other]}
              hrefLang={HTML_LANG[other]}
              lang={HTML_LANG[other]}>
              {LOCALE_LABEL[other]}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <nav aria-label={SITE.name}>
          <Link href={ROUTES.privacy[locale]}>{t.nav.privacy}</Link>
          <Link href={ROUTES.terms[locale]}>{t.nav.terms}</Link>
          <a href={`mailto:${SITE.supportEmail}`}>{t.nav.support}</a>
        </nav>
      </footer>
    </>
  )
}
