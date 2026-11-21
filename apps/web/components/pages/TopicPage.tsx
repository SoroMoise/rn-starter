import { getContent } from '@/content'
import type { Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import type { TopicKey } from '@/lib/pageTree'
import { AsideCard, FaqSection, FinalCta, RelatedCards, Sections } from '../content/Blocks'
import { Typeset } from '../content/RichText'
import { PageHero } from '../layout/PageHero'
import { SiteShell } from '../layout/SiteShell'
import { Icon } from '../ui/Icon'
import { StoreCta } from '../ui/StoreButton'

export function TopicPage({ locale, route }: { locale: Locale; route: TopicKey }) {
  const page = getContent(locale).topics[route]
  const jsonLd = graphFor({ locale, route, faq: page.faq })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <PageHero
        locale={locale}
        route={route}
        eyebrow={page.eyebrow}
        title={page.h1}
        lead={page.lead}>
        <ul className="chips">
          {page.highlights.map((highlight) => (
            <li key={highlight} className="chip">
              <Icon name="check" size={16} />
              <Typeset text={highlight} locale={locale} />
            </li>
          ))}
        </ul>
        <StoreCta locale={locale} route={route} placement="hero" />
      </PageHero>

      <section className="section">
        <div className="container with-aside">
          <article className="prose">
            <Sections sections={page.sections} locale={locale} route={route} />
          </article>
          <aside className="aside-sticky">
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
