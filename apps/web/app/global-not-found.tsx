import type { Metadata } from 'next'
import Link from 'next/link'
import { RootHtml } from '@/components/RootHtml'
import { getContent } from '@/content'
import { DEFAULT_LOCALE, HTML_LANG, LOCALES } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { SITE } from '@/lib/site'

const t = getContent(DEFAULT_LOCALE).common.notFound

export const metadata: Metadata = {
  title: `${t.title} · ${SITE.name}`,
  robots: { index: false, follow: true },
}

export default function GlobalNotFound() {
  return (
    <RootHtml locale={DEFAULT_LOCALE}>
      <main className="container not-found">
        <h1>{t.title}</h1>
        <p>{t.body}</p>
        <p className="not-found-actions">
          {LOCALES.map((locale) => (
            <Link
              key={locale}
              className={locale === DEFAULT_LOCALE ? 'btn btn--primary' : 'btn btn--secondary'}
              href={ROUTES.home[locale]}
              hrefLang={HTML_LANG[locale]}
              lang={HTML_LANG[locale]}>
              {getContent(locale).common.notFound.cta}
            </Link>
          ))}
        </p>
      </main>
    </RootHtml>
  )
}
