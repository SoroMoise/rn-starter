import Link from 'next/link'
import { RootHtml } from '@/components/RootHtml'
import { getSiteContent } from '@/content'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'

// With one root layout per locale, nothing wraps this file, so it renders the document itself — in
// the default locale, since the locale of a URL that matched nothing is unknown.
export default function NotFound() {
  const t = getSiteContent(DEFAULT_LOCALE)

  return (
    <RootHtml locale={DEFAULT_LOCALE}>
      <main className="not-found">
        <h1>{t.notFound.title}</h1>
        <p>{t.notFound.body}</p>
        <Link href={ROUTES.home[DEFAULT_LOCALE]}>{t.notFound.cta}</Link>
      </main>
    </RootHtml>
  )
}
