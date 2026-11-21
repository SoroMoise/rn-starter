import { getContent, pageInfo } from '@/content'
import type { QA } from '@/content/types'
import { FEATURE_IDS, isAvailable } from './features'
import { pageGraph, type PageGraph } from './jsonLd'
import { breadcrumbTrail } from './pageTree'
import { richToPlain } from './richText'
import { isVisible } from './visibility'

export function graphFor({
  locale,
  route,
  pageType,
  faq,
  article,
  howTo,
}: Pick<PageGraph, 'locale' | 'route' | 'pageType' | 'article' | 'howTo'> & {
  faq?: QA[]
}): Record<string, unknown> {
  const content = getContent(locale)
  const { meta } = pageInfo({ key: route, locale })

  return pageGraph({
    locale,
    route,
    title: meta.title,
    description: meta.description,
    pageType,
    appDescription: content.common.appDefinition,
    featureList: FEATURE_IDS.filter(isAvailable).map((id) => content.features.items[id].title),
    crumbs:
      route === 'home'
        ? undefined
        : breadcrumbTrail(route).map((key) => ({
            route: key,
            name: pageInfo({ key, locale }).label,
          })),
    faq: faq
      ?.filter(isVisible)
      .map((item) => ({ q: item.q, a: richToPlain({ text: item.a, locale }) })),
    article,
    howTo,
  })
}
