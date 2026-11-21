import type { ReactNode } from 'react'
import { getContent } from '@/content'
import type { Locale } from '@/lib/i18n'
import type { RouteKey } from '@/lib/routes'
import { JsonLd } from '../JsonLd'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function SiteShell({
  locale,
  route,
  jsonLd,
  children,
}: {
  locale: Locale
  route: RouteKey
  jsonLd?: Record<string, unknown>
  children: ReactNode
}) {
  const { skipToContent } = getContent(locale).common

  return (
    <>
      <a className="skip-link" href="#main">
        {skipToContent}
      </a>
      <SiteHeader locale={locale} route={route} />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} route={route} />
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
    </>
  )
}
