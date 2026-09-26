import type { LegalDocument } from '@/content/types'
import { getSiteContent } from '@/content'
import { HTML_LANG, type Locale } from '@/lib/i18n'
import { hasPlaceholders, SITE } from '@/lib/site'

function formatDate({ value, locale }: { value: string; locale: Locale }): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return new Intl.DateTimeFormat(HTML_LANG[locale], { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(value)
  )
}

export function LegalDocumentView({
  locale,
  document,
}: {
  locale: Locale
  document: LegalDocument
}) {
  const t = getSiteContent(locale)

  return (
    <article className="legal">
      {hasPlaceholders(JSON.stringify(document)) ? (
        <p className="template-notice" role="note">
          {t.legal.templateNotice}
        </p>
      ) : null}
      <h1>{document.title}</h1>
      <p className="updated">
        {t.legal.updated}: {formatDate({ value: SITE.legalUpdated, locale })}
      </p>
      {document.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {document.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.list ? (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  )
}
