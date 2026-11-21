import { getContent } from '@/content'
import type { Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import { isVisible } from '@/lib/visibility'
import { FaqSection, FinalCta } from '../content/Blocks'
import { RichText, Typeset } from '../content/RichText'
import { PageHero } from '../layout/PageHero'
import { SiteShell } from '../layout/SiteShell'
import { Icon } from '../ui/Icon'
import { StoreButton } from '../ui/StoreButton'

export function PricingPage({ locale }: { locale: Locale }) {
  const { pricing, common } = getContent(locale)
  const route = 'pricing'

  const jsonLd = graphFor({
    locale,
    route,
    faq: pricing.faq,
  })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <PageHero
        locale={locale}
        route={route}
        eyebrow={pricing.eyebrow}
        title={pricing.h1}
        lead={pricing.lead}
      />

      <section className="section" aria-label={`${pricing.freeTitle} / ${pricing.proTitle}`}>
        <div className="container">
          <div className="plans">
            <article className="plan">
              <div className="plan-head">
                <h2 className="plan-title">{pricing.freeTitle}</h2>
                <span className="badge badge--free">{common.badges.free}</span>
              </div>
              <p>
                <RichText text={pricing.freeLead} locale={locale} />
              </p>
              <ul>
                {pricing.freePoints.map((point) => (
                  <li key={point}>
                    <Icon name="check" size={18} />
                    <span>
                      <RichText text={point} locale={locale} />
                    </span>
                  </li>
                ))}
              </ul>
              <StoreButton locale={locale} route={route} placement="pricing" block />
            </article>
            <article className="plan plan--pro">
              <div className="plan-head">
                <h2 className="plan-title">{pricing.proTitle}</h2>
                <span className="badge badge--pro">{common.badges.pro}</span>
              </div>
              <p>
                <RichText text={pricing.proLead} locale={locale} />
              </p>
              <ul>
                {pricing.proPoints.filter(isVisible).map((point) => (
                  <li key={point.title}>
                    <Icon name={point.icon} size={18} />
                    <span>
                      <strong>
                        <Typeset text={point.title} locale={locale} />
                      </strong>{' '}
                      <RichText text={point.text} locale={locale} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="plan-note">
                <RichText text={pricing.priceNote} locale={locale} />
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="table-title">
        <div className="container container--prose">
          <h2 id="table-title" className="faq-heading">
            <Typeset text={pricing.tableTitle} locale={locale} />
          </h2>
          <div className="table-wrap">
            <table className="table pricing-table">
              <thead>
                <tr>
                  {pricing.tableHead.map((cell) => (
                    <th key={cell} scope="col">
                      <Typeset text={cell} locale={locale} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricing.tableRows.filter(isVisible).map((row) => (
                  <tr key={row.label}>
                    <th scope="row">
                      <RichText text={row.label} locale={locale} />
                    </th>
                    <td>
                      <RichText text={row.free} locale={locale} />
                    </td>
                    <td>
                      <RichText text={row.pro} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {pricing.unlocks.length > 0 && (
        <section className="section" aria-labelledby="unlock-title">
          <div className="container">
            <div className="section-head">
              <h2 id="unlock-title">
                <Typeset text={pricing.unlockTitle} locale={locale} />
              </h2>
            </div>
            <div className="grid grid--3">
              {pricing.unlocks.map((unlock) => (
                <article className="card" key={unlock.title}>
                  <span className="icon-plate">
                    <Icon name="play" />
                  </span>
                  <h3>
                    <Typeset text={unlock.title} locale={locale} />
                  </h3>
                  <p>
                    <RichText text={unlock.text} locale={locale} />
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <FaqSection items={pricing.faq} locale={locale} />
      <FinalCta locale={locale} route={route} />
    </SiteShell>
  )
}
