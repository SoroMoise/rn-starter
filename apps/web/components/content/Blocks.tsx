import Link from 'next/link'
import { getContent, pageInfo } from '@/content'
import type { Block, QA, Section } from '@/content/types'
import type { Locale } from '@/lib/i18n'
import { ROUTES, type RouteKey } from '@/lib/routes'
import { isVisible } from '@/lib/visibility'
import { Icon } from '../ui/Icon'
import { StoreButton, StoreCta } from '../ui/StoreButton'
import { RichText, Typeset } from './RichText'

export function sectionId(section: Section): string {
  if (section.id) return section.id
  return section.title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function BlockView({ block, locale, route }: { block: Block; locale: Locale; route: RouteKey }) {
  switch (block.type) {
    case 'p':
      return (
        <p>
          <RichText text={block.text} locale={locale} />
        </p>
      )
    case 'list': {
      const items = block.items.map((item) => (
        <li key={item}>
          <RichText text={item} locale={locale} />
        </li>
      ))
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>
    }
    case 'steps':
      return (
        <ol className="steps">
          {block.items.map((item) => (
            <li key={item.title}>
              <strong>
                <Typeset text={item.title} locale={locale} />
              </strong>
              <p>
                <RichText text={item.text} locale={locale} />
              </p>
            </li>
          ))}
        </ol>
      )
    case 'callout':
      return (
        <aside className={`callout callout--${block.tone}`}>
          <Icon name={block.tone === 'tip' ? 'bulb' : block.tone === 'limit' ? 'info' : 'check'} />
          {block.title ? (
            <p className="callout-title">
              <Typeset text={block.title} locale={locale} />
            </p>
          ) : null}
          <p>
            <RichText text={block.text} locale={locale} />
          </p>
        </aside>
      )
    case 'table':
      return (
        <div className="table-wrap">
          <table className="table">
            {block.caption ? (
              <caption>
                <Typeset text={block.caption} locale={locale} />
              </caption>
            ) : null}
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th key={cell} scope="col">
                    <Typeset text={cell} locale={locale} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join('|')}>
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th key={index} scope="row">
                        <RichText text={cell} locale={locale} />
                      </th>
                    ) : (
                      <td key={index}>
                        <RichText text={cell} locale={locale} />
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'h3':
      return (
        <h3>
          <Typeset text={block.text} locale={locale} />
        </h3>
      )
    case 'cta':
      return (
        <div className="inline-cta">
          {block.text ? (
            <p>
              <Typeset text={block.text} locale={locale} />
            </p>
          ) : null}
          <StoreCta locale={locale} route={route} placement="inline" />
        </div>
      )
  }
}

export function Blocks({
  blocks,
  locale,
  route,
}: {
  blocks: Block[]
  locale: Locale
  route: RouteKey
}) {
  return (
    <>
      {blocks.filter(isVisible).map((block, index) => (
        <BlockView key={index} block={block} locale={locale} route={route} />
      ))}
    </>
  )
}

export function Sections({
  sections,
  locale,
  route,
}: {
  sections: Section[]
  locale: Locale
  route: RouteKey
}) {
  return (
    <>
      {sections.filter(isVisible).map((section) => (
        <section key={section.title} id={sectionId(section)} className="prose-section">
          <h2>
            <Typeset text={section.title} locale={locale} />
          </h2>
          <Blocks blocks={section.blocks} locale={locale} route={route} />
        </section>
      ))}
    </>
  )
}

export function FaqList({ items, locale }: { items: QA[]; locale: Locale }) {
  return (
    <div className="faq">
      {items.filter(isVisible).map((item) => (
        <details key={item.q} className="faq-item" id={item.id}>
          <summary>
            <Typeset text={item.q} locale={locale} />
            <Icon name="chevronDown" size={20} />
          </summary>
          <div className="faq-answer">
            <p>
              <RichText text={item.a} locale={locale} />
            </p>
          </div>
        </details>
      ))}
    </div>
  )
}

export function FaqSection({
  items,
  locale,
  title,
}: {
  items: QA[]
  locale: Locale
  title?: string
}) {
  const visible = items.filter(isVisible)
  if (!visible.length) return null
  const { faqTitle } = getContent(locale).common
  return (
    <section className="section section--tight" aria-labelledby="faq-title">
      <div className="container container--prose">
        <h2 id="faq-title" className="faq-heading">
          <Typeset text={title ?? faqTitle} locale={locale} />
        </h2>
        <FaqList items={visible} locale={locale} />
      </div>
    </section>
  )
}

export function RelatedCards({
  routes,
  locale,
  title,
}: {
  routes: RouteKey[]
  locale: Locale
  title?: string
}) {
  if (!routes.length) return null
  const { related, cta } = getContent(locale).common
  return (
    <section className="section section--tight" aria-labelledby="related-title">
      <div className="container">
        <h2 id="related-title" className="related-heading">
          <Typeset text={title ?? related} locale={locale} />
        </h2>
        <div className="grid grid--3">
          {routes.map((key) => {
            const { card } = pageInfo({ key, locale })
            return (
              <Link key={key} href={ROUTES[key][locale]} className="card card--link">
                <h3>
                  <Typeset text={card.title} locale={locale} />
                </h3>
                <p>
                  <Typeset text={card.text} locale={locale} />
                </p>
                <span className="card-more">
                  {cta.learnMore}
                  <Icon name="arrowRight" size={16} className="flip-rtl" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FinalCta({ locale, route }: { locale: Locale; route: RouteKey }) {
  const { finalCta } = getContent(locale).common
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="final-cta">
          <div className="final-cta-inner">
            <h2>
              <Typeset text={finalCta.title} locale={locale} />
            </h2>
            <p>
              <Typeset text={finalCta.text} locale={locale} />
            </p>
            <StoreCta locale={locale} route={route} placement="band" center />
            <p className="store-note">
              <RichText text={finalCta.note} locale={locale} />
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AsideCard({ locale, route }: { locale: Locale; route: RouteKey }) {
  const { aside } = getContent(locale).common
  return (
    <div className="aside-card">
      <h2>
        <Typeset text={aside.title} locale={locale} />
      </h2>
      <ul>
        {aside.points.map((point) => (
          <li key={point}>
            <Icon name="check" size={16} />
            <Typeset text={point} locale={locale} />
          </li>
        ))}
      </ul>
      <StoreButton locale={locale} route={route} placement="aside" short block />
    </div>
  )
}
