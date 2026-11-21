import { getContent } from '@/content'
import { FEATURE_GROUPS, FEATURES, featuresIn, IOS_STATUS, SOON_FEATURES } from '@/lib/features'
import type { Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import { isVisible } from '@/lib/visibility'
import { FinalCta } from '../content/Blocks'
import { RichText, Typeset } from '../content/RichText'
import { PageHero } from '../layout/PageHero'
import { SiteShell } from '../layout/SiteShell'
import { Icon } from '../ui/Icon'
import { StoreCta } from '../ui/StoreButton'

export function FeaturesPage({ locale }: { locale: Locale }) {
  const { features, common } = getContent(locale)
  const route = 'features'
  const soon = SOON_FEATURES

  const jsonLd = graphFor({
    locale,
    route,
  })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <PageHero
        locale={locale}
        route={route}
        eyebrow={features.eyebrow}
        title={features.h1}
        lead={features.lead}>
        <StoreCta locale={locale} route={route} placement="hero" />
      </PageHero>

      {FEATURE_GROUPS.map((group, index) => {
        const ids = featuresIn(group)
        if (!ids.length) return null
        const copy = features.groups[group]
        return (
          <section
            key={group}
            id={group}
            className={index % 2 === 1 ? 'section section--surface' : 'section'}
            aria-labelledby={`${group}-title`}>
            <div className="container">
              <div className="section-head">
                <h2 id={`${group}-title`}>
                  <Typeset text={copy.title} locale={locale} />
                </h2>
                <p>
                  <RichText text={copy.lead} locale={locale} />
                </p>
              </div>
              <div className="grid grid--3">
                {ids.map((id) => (
                  <article className="card feature-card" key={id} id={id}>
                    <div className="card-head">
                      <span
                        className={
                          FEATURES[id].tier === 'pro' ? 'icon-plate icon-plate--pro' : 'icon-plate'
                        }>
                        <Icon name={FEATURES[id].icon} />
                      </span>
                      {FEATURES[id].tier === 'pro' ? (
                        <span className="badge badge--pro">{common.badges.pro}</span>
                      ) : null}
                    </div>
                    <h3>
                      <Typeset text={features.items[id].title} locale={locale} />
                    </h3>
                    <p>
                      <RichText text={features.items[id].text} locale={locale} />
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      <section className="section" id="specifications" aria-labelledby="specs-title">
        <div className="container container--prose">
          <h2 id="specs-title" className="faq-heading">
            <Typeset text={features.specsTitle} locale={locale} />
          </h2>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {features.specs.filter(isVisible).map((spec) => (
                  <tr key={spec.label}>
                    <th scope="row">
                      <Typeset text={spec.label} locale={locale} />
                    </th>
                    <td>
                      <RichText text={spec.value} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {IOS_STATUS === 'soon' || soon.length ? (
        <section className="section section--tight" aria-labelledby="soon-title">
          <div className="container container--prose">
            <div className="card">
              <div className="card-head">
                <span className="icon-plate icon-plate--muted">
                  <Icon name="phone" />
                </span>
                <span className="badge badge--soon">{common.badges.soon}</span>
              </div>
              <h2 id="soon-title" className="card-title">
                <Typeset text={features.soonTitle} locale={locale} />
              </h2>
              {IOS_STATUS === 'soon' ? (
                <p>
                  <Typeset text={common.iosSoon} locale={locale} />
                </p>
              ) : null}
              {soon.length ? (
                <p>
                  <RichText text={features.soonText} locale={locale} />
                </p>
              ) : null}
              {soon.length ? (
                <ul className="chips">
                  {soon.map((id) => (
                    <li key={id} className="chip">
                      <Icon name={FEATURES[id].icon} size={16} />
                      {features.items[id].title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <FinalCta locale={locale} route={route} />
    </SiteShell>
  )
}
