import { getContent } from '@/content'
import type { Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import { isVisible } from '@/lib/visibility'
import { FaqList, FinalCta } from '../content/Blocks'
import { Typeset } from '../content/RichText'
import { PageHero } from '../layout/PageHero'
import { SiteShell } from '../layout/SiteShell'

export function FaqPage({ locale }: { locale: Locale }) {
  const { faq } = getContent(locale)
  const route = 'faq'
  const groups = faq.groups
    .map((group) => ({ ...group, items: group.items.filter(isVisible) }))
    .filter((group) => group.items.length)

  const jsonLd = graphFor({
    locale,
    route,
    pageType: 'FAQPage',
    faq: groups.flatMap((group) => group.items),
  })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <PageHero locale={locale} route={route} eyebrow={faq.eyebrow} title={faq.h1} lead={faq.lead}>
        <nav aria-label={faq.h1}>
          <ul className="chips">
            {groups.map((group) => (
              <li key={group.id}>
                <a className="chip" href={`#${group.id}`}>
                  <Typeset text={group.title} locale={locale} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <section className="section">
        <div className="container container--prose">
          {groups.map((group) => (
            <section
              key={group.id}
              id={group.id}
              className="faq-group"
              aria-labelledby={`${group.id}-title`}>
              <h2 id={`${group.id}-title`}>
                <Typeset text={group.title} locale={locale} />
              </h2>
              <FaqList items={group.items} locale={locale} />
            </section>
          ))}
        </div>
      </section>

      <FinalCta locale={locale} route={route} />
    </SiteShell>
  )
}
