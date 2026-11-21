import { getContent } from '@/content'
import { formatDate, type Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import type { GuideKey } from '@/lib/pageTree'
import { readingMinutes } from '@/lib/readingTime'
import { isVisible } from '@/lib/visibility'
import {
  AsideCard,
  FaqSection,
  FinalCta,
  RelatedCards,
  sectionId,
  Sections,
} from '../content/Blocks'
import { RichText, Typeset } from '../content/RichText'
import { PageHero } from '../layout/PageHero'
import { SiteShell } from '../layout/SiteShell'
import { Icon } from '../ui/Icon'

export function GuidePage({ locale, route }: { locale: Locale; route: GuideKey }) {
  const { guides, common } = getContent(locale)
  const page = guides[route]
  const sections = page.sections.filter(isVisible)
  const minutes = readingMinutes({ lead: page.lead, sections })
  const stepsSection = sections.find((section) =>
    section.blocks.some((block) => block.type === 'steps' && isVisible(block))
  )

  const jsonLd = graphFor({
    locale,
    route,
    faq: page.faq,
    article: {
      headline: page.h1,
      published: page.published,
      updated: page.updated,
      sections: sections.map((section) => section.title),
    },
    howTo: page.howTo
      ? { ...page.howTo, anchor: stepsSection ? sectionId(stepsSection) : undefined }
      : undefined,
  })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <PageHero locale={locale} route={route} title={page.h1} lead={page.lead}>
        <p className="article-meta">
          <span>
            {common.updated}{' '}
            <time dateTime={page.updated}>{formatDate({ value: page.updated, locale })}</time>
          </span>
          <span>
            <Typeset
              text={common.readingTime.replace('{minutes}', String(minutes))}
              locale={locale}
            />
          </span>
        </p>
      </PageHero>

      <section className="section">
        <div className="container with-aside">
          <article className="prose">
            <div className="takeaways">
              <h2>
                <Typeset text={common.takeaways} locale={locale} />
              </h2>
              <ul>
                {page.takeaways.map((item) => (
                  <li key={item}>
                    <Icon name="check" size={16} />
                    <span>
                      <RichText text={item} locale={locale} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Sections sections={sections} locale={locale} route={route} />
          </article>
          <aside className="aside-sticky stack">
            <nav className="toc" aria-labelledby="toc-title">
              <h2 id="toc-title">{common.onThisPage}</h2>
              <ol>
                {sections.map((section) => (
                  <li key={section.title}>
                    <a href={`#${sectionId(section)}`}>
                      <Typeset text={section.title} locale={locale} />
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <AsideCard locale={locale} route={route} />
          </aside>
        </div>
      </section>

      <FaqSection items={page.faq} locale={locale} />
      <RelatedCards routes={page.related} locale={locale} />
      <FinalCta locale={locale} route={route} />
    </SiteShell>
  )
}
