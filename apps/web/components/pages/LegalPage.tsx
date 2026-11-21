import { getContent } from '@/content'
import type { LegalDocument } from '@/content/types'
import { formatDate, type Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import type { LegalKey } from '@/lib/pageTree'
import { hasPlaceholders, SITE } from '@/lib/site'
import { Typeset } from '../content/RichText'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { SiteShell } from '../layout/SiteShell'

function textOf(document: LegalDocument): string {
  return [
    document.title,
    document.description,
    ...document.intro,
    ...document.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
      ...(section.list ?? []),
    ]),
  ].join('\n')
}

export function LegalPage({ locale, route }: { locale: Locale; route: LegalKey }) {
  const { legal, common } = getContent(locale)
  const document = legal[route]

  const jsonLd = graphFor({ locale, route })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <article className="container container--prose legal">
        <Breadcrumbs locale={locale} route={route} />
        {hasPlaceholders(textOf(document)) ? (
          <p className="template-notice" role="note">
            {common.legal.templateNotice}
          </p>
        ) : null}
        <h1>
          <Typeset text={document.title} locale={locale} />
        </h1>
        <p className="updated">
          <Typeset
            text={`${common.legal.updated} ${formatDate({ value: SITE.legalUpdated, locale })}`}
            locale={locale}
          />
        </p>
        {document.intro.map((paragraph) => (
          <p key={paragraph}>
            <Typeset text={paragraph} locale={locale} />
          </p>
        ))}
        {document.sections.map((section) => (
          <section key={section.title}>
            <h2>
              <Typeset text={section.title} locale={locale} />
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                <Typeset text={paragraph} locale={locale} />
              </p>
            ))}
            {section.list ? (
              <ul>
                {section.list.map((item) => (
                  <li key={item}>
                    <Typeset text={item} locale={locale} />
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </article>
    </SiteShell>
  )
}
