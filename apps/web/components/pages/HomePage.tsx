import Link from 'next/link'
import { getContent, pageInfo } from '@/content'
import type { QA } from '@/content/types'
import { FEATURES, isAvailable } from '@/lib/features'
import type { Locale } from '@/lib/i18n'
import { graphFor } from '@/lib/pageGraph'
import { HUB_CHILDREN } from '@/lib/pageTree'
import { ROUTES } from '@/lib/routes'
import { isVisible } from '@/lib/visibility'
import { FaqSection, FinalCta } from '../content/Blocks'
import { RichText, Typeset } from '../content/RichText'
import { SiteShell } from '../layout/SiteShell'
import { Icon } from '../ui/Icon'
import { PhoneFrame } from '../ui/PhoneFrame'
import { StoreCta } from '../ui/StoreButton'

export function homeFaq(locale: Locale): QA[] {
  const { home, faq } = getContent(locale)
  const all = faq.groups.flatMap((group) => group.items)
  return home.faqIds
    .map((id) => all.find((item) => item.id === id))
    .filter((item): item is QA => Boolean(item))
}

export function HomePage({ locale }: { locale: Locale }) {
  const content = getContent(locale)
  const { home, common, features, pricing } = content
  const route = 'home'
  const faq = homeFaq(locale)
  const jsonLd = graphFor({ locale, route, faq })

  return (
    <SiteShell locale={locale} route={route} jsonLd={jsonLd}>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{home.eyebrow}</span>
            <h1>
              <Typeset text={home.h1} locale={locale} />
            </h1>
            <p className="lead">
              <RichText text={home.lead} locale={locale} />
            </p>
            <div className="hero-actions">
              <StoreCta locale={locale} route={route} placement="hero" />
            </div>
            <ul className="reassurance">
              {home.reassurance.map((item) => (
                <li key={item}>
                  <Icon name="check" size={18} />
                  <Typeset text={item} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
          <figure className="hero-visual">
            <PhoneFrame locale={locale} />
          </figure>
        </div>
      </section>

      <section className="section section--surface" id="how" aria-labelledby="how-title">
        <div className="container">
          <div className="section-head section-head--center">
            <h2 id="how-title">
              <Typeset text={home.stepsTitle} locale={locale} />
            </h2>
          </div>
          <ol className="how-steps">
            {home.steps.map((step) => (
              <li className="how-step" key={step.title}>
                <h3>
                  <Typeset text={step.title} locale={locale} />
                </h3>
                <p>
                  <RichText text={step.text} locale={locale} />
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <div className="section-head">
            <h2 id="features-title">
              <Typeset text={home.featuresTitle} locale={locale} />
            </h2>
            <p>
              <RichText text={home.featuresLead} locale={locale} />
            </p>
          </div>
          <div className="grid grid--3">
            {home.featureIds.filter(isAvailable).map((id) => (
              <article className="card feature-card" key={id}>
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
          <div className="cards-more">
            <Link className="btn btn--secondary" href={ROUTES.features[locale]}>
              {common.cta.seeAll}
              <Icon name="arrowRight" size={18} className="flip-rtl" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--ink" aria-labelledby="trust-title">
        <div className="container stack-lg">
          <div className="section-head">
            <span className="eyebrow">
              <Icon name="shield" size={16} />
              {home.trustEyebrow}
            </span>
            <h2 id="trust-title">
              <Typeset text={home.trustTitle} locale={locale} />
            </h2>
            <p>
              <RichText text={home.trustLead} locale={locale} />
            </p>
          </div>
          <ul className="trust-points">
            {home.trustPoints.map((point) => (
              <li className="trust-point" key={point.title}>
                <Icon name={point.icon} size={26} />
                <h3>
                  <Typeset text={point.title} locale={locale} />
                </h3>
                <p>
                  <RichText text={point.text} locale={locale} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="usecases-title">
        <div className="container">
          <div className="section-head">
            <h2 id="usecases-title">
              <Typeset text={home.useCasesTitle} locale={locale} />
            </h2>
            <p>
              <RichText text={home.useCasesLead} locale={locale} />
            </p>
          </div>
          <div className="grid grid--3">
            {HUB_CHILDREN.useCases.map((key) => {
              const { card } = pageInfo({ key, locale })
              return (
                <Link key={key} href={ROUTES[key][locale]} className="card card--link">
                  <span className="icon-plate">
                    <Icon name={content.topics[key].icon} />
                  </span>
                  <h3>
                    <Typeset text={card.title} locale={locale} />
                  </h3>
                  <p>
                    <Typeset text={card.text} locale={locale} />
                  </p>
                  <span className="card-more">
                    {common.cta.learnMore}
                    <Icon name="arrowRight" size={16} className="flip-rtl" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="plans-title">
        <div className="container">
          <div className="section-head section-head--center">
            <h2 id="plans-title">
              <Typeset text={home.plansTitle} locale={locale} />
            </h2>
            <p>
              <RichText text={home.plansLead} locale={locale} />
            </p>
          </div>
          <div className="plans">
            <article className="plan">
              <div className="plan-head">
                <h3>{pricing.freeTitle}</h3>
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
            </article>
            <article className="plan plan--pro">
              <div className="plan-head">
                <h3>{pricing.proTitle}</h3>
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
          <div className="cards-more">
            <Link className="btn btn--secondary" href={ROUTES.pricing[locale]}>
              {common.pageNames.pricing}
              <Icon name="arrowRight" size={18} className="flip-rtl" />
            </Link>
          </div>
        </div>
      </section>

      <FaqSection items={faq} locale={locale} />
      <FinalCta locale={locale} route={route} />
    </SiteShell>
  )
}
