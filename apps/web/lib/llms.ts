import { getContent, pageInfo } from '@/content'
import type { Block, QA, Section } from '@/content/types'
import { FEATURE_GROUPS, featuresIn, IOS_STATUS, isPro, SOON_FEATURES } from './features'
import { DEFAULT_LOCALE, LOCALE_LABEL, LOCALES, type Locale } from './i18n'
import { CORE_KEYS, HUB_CHILDREN, HUB_KEYS, isGuide, isHub, isLegal, isTopic } from './pageTree'
import { richToMarkdown } from './richText'
import { feedPath, ROUTE_KEYS, type RouteKey } from './routes'
import { SITE, STORE_URL } from './site'
import { absoluteUrl, pageUrl } from './url'
import { isVisible } from './visibility'

const LOCALE: Locale = DEFAULT_LOCALE

function md(text: string): string {
  return richToMarkdown({ text, locale: LOCALE })
}

function link(route: RouteKey, locale: Locale = LOCALE): string {
  const { h1, meta } = pageInfo({ key: route, locale })
  return `- [${h1}](${pageUrl({ route, locale })}): ${meta.description}`
}

function keyFacts(): string[] {
  const { features } = getContent(LOCALE)
  return [
    `Install: ${STORE_URL}.${IOS_STATUS === 'soon' ? ' No iPhone version yet.' : ''}`,
    `Website languages: ${LOCALES.map((locale) => LOCALE_LABEL[locale]).join(', ')}.`,
    ...features.specs.filter(isVisible).map((spec) => `${spec.label}: ${md(spec.value)}`),
    `Publisher: ${SITE.publisher}. Support: ${SITE.supportEmail}. Website: ${SITE.url}.`,
  ]
}

export function llmsIndex(): string {
  const { common } = getContent(LOCALE)
  const others = LOCALES.filter((locale) => locale !== LOCALE)
  return [
    `# ${SITE.name}`,
    '',
    `> ${common.appDefinition}`,
    '',
    'Key facts:',
    ...keyFacts().map((fact) => `- ${fact}`),
    '',
    '## Product',
    ...CORE_KEYS.map((route) => link(route)),
    ...HUB_KEYS.flatMap((hub) => [
      '',
      `## ${pageInfo({ key: hub, locale: LOCALE }).label}`,
      link(hub),
      ...HUB_CHILDREN[hub].map((route) => link(route)),
    ]),
    ...others.flatMap((locale) => [
      '',
      `## ${LOCALE_LABEL[locale]}`,
      ...ROUTE_KEYS.filter((route) => !isLegal(route)).map((route) => link(route, locale)),
    ]),
    '',
    '## Optional',
    `- [Full text of the ${LOCALE_LABEL[LOCALE]} pages](${SITE.url}/llms-full.txt): every page above but the legal ones, as Markdown`,
    `- [Guides feed](${absoluteUrl(feedPath(LOCALE))}): RSS`,
    link('privacy'),
    link('terms'),
    '',
  ].join('\n')
}

function blockToMarkdown(block: Block): string {
  if (!isVisible(block)) return ''
  switch (block.type) {
    case 'p':
      return md(block.text)
    case 'list':
      return block.items
        .map((item, index) => `${block.ordered ? `${index + 1}.` : '-'} ${md(item)}`)
        .join('\n')
    case 'steps':
      return block.items
        .map((item, index) => `${index + 1}. **${item.title}** ${md(item.text)}`)
        .join('\n')
    case 'callout':
      return `> ${block.title ? `**${block.title}** ` : ''}${md(block.text)}`
    case 'table':
      return table({ head: block.head, rows: block.rows })
    case 'h3':
      return `### ${block.text}`
    case 'cta':
      return ''
  }
}

function table({ head, rows }: { head: string[]; rows: string[][] }): string {
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(md).join(' | ')} |`),
  ].join('\n')
}

function sectionsToMarkdown(sections: Section[]): string {
  return sections
    .filter(isVisible)
    .map((section) =>
      [`## ${section.title}`, ...section.blocks.map(blockToMarkdown).filter(Boolean)].join('\n\n')
    )
    .join('\n\n')
}

function faqToMarkdown(items: QA[]): string {
  const visible = items.filter(isVisible)
  if (!visible.length) return ''
  const { faqTitle } = getContent(LOCALE).common
  return [`## ${faqTitle}`, ...visible.map((item) => `### ${item.q}\n\n${md(item.a)}`)].join('\n\n')
}

function pageBody(route: RouteKey): string[] {
  const content = getContent(LOCALE)

  if (isTopic(route)) {
    const page = content.topics[route]
    return [md(page.lead), sectionsToMarkdown(page.sections), faqToMarkdown(page.faq)]
  }
  if (isGuide(route)) {
    const page = content.guides[route]
    return [
      `${content.common.updated}: ${page.updated}`,
      md(page.lead),
      [`${content.common.takeaways}:`, ...page.takeaways.map((item) => `- ${md(item)}`)].join('\n'),
      sectionsToMarkdown(page.sections),
      faqToMarkdown(page.faq),
    ]
  }
  if (isHub(route)) {
    const page = content.hubs[route]
    return [
      md(page.lead),
      HUB_CHILDREN[route].map((child) => link(child)).join('\n'),
      sectionsToMarkdown(page.sections),
      faqToMarkdown(page.faq),
    ]
  }

  switch (route) {
    case 'home': {
      const home = content.home
      return [
        md(home.lead),
        `## ${home.stepsTitle}`,
        home.steps
          .map((step, index) => `${index + 1}. **${step.title}** ${md(step.text)}`)
          .join('\n'),
        `## ${home.trustTitle}`,
        md(home.trustLead),
        home.trustPoints.map((point) => `- **${point.title}** ${md(point.text)}`).join('\n'),
      ]
    }
    case 'features': {
      const page = content.features
      return [
        md(page.lead),
        ...FEATURE_GROUPS.map((group) => {
          const ids = featuresIn(group)
          if (!ids.length) return ''
          return [
            `## ${page.groups[group].title}`,
            md(page.groups[group].lead),
            ids
              .map(
                (id) =>
                  `- **${page.items[id].title}**${isPro(id) ? ' (Pro)' : ''}: ${md(page.items[id].text)}`
              )
              .join('\n'),
          ].join('\n\n')
        }),
        `## ${page.specsTitle}`,
        page.specs
          .filter(isVisible)
          .map((spec) => `- **${spec.label}**: ${md(spec.value)}`)
          .join('\n'),
        ...(IOS_STATUS === 'soon' || SOON_FEATURES.length
          ? [
              `## ${page.soonTitle}`,
              md(page.soonText),
              SOON_FEATURES.map((id) => `- ${page.items[id].title}`).join('\n'),
            ]
          : []),
      ]
    }
    case 'pricing': {
      const page = content.pricing
      return [
        md(page.lead),
        `## ${page.freeTitle}`,
        md(page.freeLead),
        page.freePoints.map((point) => `- ${md(point)}`).join('\n'),
        `## ${page.proTitle}`,
        md(page.proLead),
        page.proPoints
          .filter(isVisible)
          .map((point) => `- **${point.title}** ${md(point.text)}`)
          .join('\n'),
        md(page.priceNote),
        `## ${page.tableTitle}`,
        table({
          head: page.tableHead,
          rows: page.tableRows.filter(isVisible).map((row) => [row.label, row.free, row.pro]),
        }),
        ...(page.unlocks.length
          ? [
              `## ${page.unlockTitle}`,
              page.unlocks.map((unlock) => `- **${unlock.title}** ${md(unlock.text)}`).join('\n'),
            ]
          : []),
        faqToMarkdown(page.faq),
      ]
    }
    case 'faq': {
      const page = content.faq
      return [
        md(page.lead),
        ...page.groups.map((group) =>
          [
            `## ${group.title}`,
            ...group.items.filter(isVisible).map((item) => `### ${item.q}\n\n${md(item.a)}`),
          ].join('\n\n')
        ),
      ]
    }
    case 'about':
      return [md(content.about.lead), sectionsToMarkdown(content.about.sections)]
    default:
      return []
  }
}

function pageToMarkdown(route: RouteKey): string {
  const { h1 } = pageInfo({ key: route, locale: LOCALE })
  return [`# ${h1}`, `URL: ${pageUrl({ route, locale: LOCALE })}`, ...pageBody(route)]
    .filter(Boolean)
    .join('\n\n')
}

export function llmsFull(): string {
  return [
    `# ${SITE.name}: full text`,
    '',
    `> The ${LOCALE_LABEL[LOCALE]} pages of ${SITE.url}, as Markdown, for language models. Summary and links: ${SITE.url}/llms.txt`,
    '',
    ...ROUTE_KEYS.filter((route) => !isLegal(route)).map(pageToMarkdown),
  ].join('\n\n---\n\n')
}
