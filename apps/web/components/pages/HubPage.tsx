import Link from 'next/link'
import { getContent, pageInfo } from '@/content'
import type { Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import { HUB_CHILDREN, isGuide, isTopic, type HubKey } from '@/lib/pageTree'
import { feedPath, ROUTES } from '@/lib/routes'
import { FaqSection, FinalCta, Sections } from '../content/Blocks'
import { Typeset } from '../content/RichText'
import { PageHero } from '../layout/PageHero'
import { SiteShell } from '../layout/SiteShell'
import { Icon } from '../ui/Icon'

export function HubPage({ locale, route }: { locale: Locale; route: HubKey }) {
  const content = getContent(locale)
  const page = content.hubs[route]
  const jsonLd = graphFor({ locale, route, pageType: 'CollectionPage', faq: page.faq })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <PageHero
        locale={locale}
        route={route}
        eyebrow={page.eyebrow}
        title={page.h1}
        lead={page.lead}>
        {route === 'guides' ? (
          <p>
            <a className="btn btn--secondary btn--sm" href={feedPath(locale)}>
              <Icon name="rss" size={18} />
              {content.common.footer.rss}
            </a>
          </p>
        ) : null}
      </PageHero>

      <section className="section" aria-label={page.breadcrumb}>
        <div className="container">
          <div className="grid grid--3">
            {HUB_CHILDREN[route].map((key) => {
              const { card } = pageInfo({ key, locale })
              return (
                <Link key={key} href={ROUTES[key][locale]} className="card card--link">
                  <span className="icon-plate">
                    <Icon name={isTopic(key) ? content.topics[key].icon : 'book'} />
                  </span>
                  <h2 className="card-title">
                    <Typeset text={card.title} locale={locale} />
                  </h2>
                  <p>
                    <Typeset text={card.text} locale={locale} />
                  </p>
                  <span className="card-more">
                    {isGuide(key) ? content.common.cta.readGuide : content.common.cta.learnMore}
                    <Icon name="arrowRight" size={16} className="flip-rtl" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {page.sections.length ? (
        <section className="section section--surface">
          <div className="container container--prose prose">
            <Sections sections={page.sections} locale={locale} route={route} />
          </div>
        </section>
      ) : null}

      <FaqSection items={page.faq} locale={locale} />
      <FinalCta locale={locale} route={route} />
    </SiteShell>
  )
}
