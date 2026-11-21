import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import type { RouteKey } from '@/lib/routes'
import { RichText, Typeset } from '../content/RichText'
import { Breadcrumbs } from './Breadcrumbs'

export function PageHero({
  locale,
  route,
  eyebrow,
  title,
  lead,
  children,
}: {
  locale: Locale
  route: RouteKey
  eyebrow?: string
  title: string
  lead?: string
  children?: ReactNode
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <div className="page-hero-inner">
          <Breadcrumbs locale={locale} route={route} />
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h1>
            <Typeset text={title} locale={locale} />
          </h1>
          {lead ? (
            <p className="lead">
              <RichText text={lead} locale={locale} />
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  )
}
