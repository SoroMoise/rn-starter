import { FACTS } from './facts'
import { HTML_LANG, LOCALES, type Locale } from './i18n'
import { SCREENSHOTS } from './images'
import type { RouteKey } from './routes'
import { isPlaceholder, SITE, STORE_URL } from './site'
import { absoluteUrl, ogImagePath, pageUrl } from './url'

const ORGANIZATION_ID = `${SITE.url}/#organization`
const WEBSITE_ID = `${SITE.url}/#website`
const APP_ID = `${SITE.url}/#app`

type Node = Record<string, unknown>

export type Crumb = { name: string; route: RouteKey }

export type PageGraph = {
  locale: Locale
  route: RouteKey
  title: string
  description: string
  pageType?: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'FAQPage'
  appDescription: string
  featureList: string[]
  crumbs?: Crumb[]
  faq?: { q: string; a: string }[]
  article?: { headline: string; published: string; updated: string; sections: string[] }
  howTo?: { name: string; anchor?: string; steps: { name: string; text: string }[] }
}

function isoDateTime(date: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00+00:00` : date
}

function known(values: string[]): string[] {
  return values.filter((value) => !isPlaceholder(value))
}

export function pageGraph(graph: PageGraph): Node {
  const url = pageUrl({ route: graph.route, locale: graph.locale })
  const image = absoluteUrl(ogImagePath({ route: graph.route, locale: graph.locale }))
  const inLanguage = HTML_LANG[graph.locale]
  const hasFaq = Boolean(graph.faq?.length)
  const baseType = graph.pageType ?? 'WebPage'
  const storeTitle = known([SITE.storeTitle])[0]

  const nodes: Node[] = [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE.publisher,
      url: known([SITE.publisherSite])[0] ?? SITE.url,
      logo: absoluteUrl('/icon.png'),
      sameAs: known([SITE.publisherSite]),
      email: SITE.supportEmail,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.supportEmail,
        availableLanguage: ['English', 'French'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE.url,
      name: SITE.name,
      inLanguage: LOCALES.map((locale) => HTML_LANG[locale]),
      publisher: { '@id': ORGANIZATION_ID },
      about: { '@id': APP_ID },
    },
    {
      '@type': 'MobileApplication',
      '@id': APP_ID,
      name: SITE.name,
      ...(storeTitle ? { alternateName: storeTitle } : {}),
      description: graph.appDescription,
      url: pageUrl({ route: 'home', locale: graph.locale }),
      image: absoluteUrl('/icon.png'),
      ...(SCREENSHOTS.length
        ? { screenshot: SCREENSHOTS.map((screenshot) => absoluteUrl(screenshot.src)) }
        : {}),
      sameAs: [STORE_URL],
      applicationCategory: SITE.applicationCategory,
      operatingSystem: `Android ${FACTS.androidVersion}+`,
      installUrl: STORE_URL,
      downloadUrl: STORE_URL,
      isAccessibleForFree: true,
      featureList: graph.featureList,
      publisher: { '@id': ORGANIZATION_ID },
      author: { '@id': ORGANIZATION_ID },
    },
    {
      '@type': hasFaq && baseType !== 'FAQPage' ? [baseType, 'FAQPage'] : baseType,
      '@id': `${url}#webpage`,
      url,
      name: graph.title,
      description: graph.description,
      inLanguage,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': APP_ID },
      primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
      ...(graph.crumbs ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
      ...(hasFaq
        ? {
            mainEntity: graph.faq?.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }
        : {}),
    },
  ]

  if (graph.crumbs) {
    nodes.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: graph.crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: pageUrl({ route: crumb.route, locale: graph.locale }),
      })),
    })
  }

  if (graph.article) {
    nodes.push({
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: graph.article.headline,
      description: graph.description,
      inLanguage,
      datePublished: isoDateTime(graph.article.published),
      dateModified: isoDateTime(graph.article.updated),
      articleSection: graph.article.sections,
      image,
      author: { '@id': ORGANIZATION_ID },
      publisher: { '@id': ORGANIZATION_ID },
      mainEntityOfPage: { '@id': `${url}#webpage` },
      about: { '@id': APP_ID },
    })
  }

  if (graph.howTo) {
    nodes.push({
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name: graph.howTo.name,
      inLanguage,
      tool: { '@type': 'HowToTool', name: SITE.name },
      step: graph.howTo.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
        ...(graph.howTo?.anchor ? { url: `${url}#${graph.howTo.anchor}` } : {}),
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': nodes }
}
