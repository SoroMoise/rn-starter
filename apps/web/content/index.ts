import type { Locale } from '@/lib/i18n'
import { isGuide, isHub, isLegal, isTopic } from '@/lib/pageTree'
import type { RouteKey } from '@/lib/routes'
import { SITE } from '@/lib/site'
import { en } from './en'
import { fr } from './fr'
import type { PageInfo, SiteContent } from './types'

const CONTENT: Record<Locale, SiteContent> = { en, fr }

export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale]
}

export function pageInfo({ key, locale }: { key: RouteKey; locale: Locale }): PageInfo {
  const content = CONTENT[locale]
  if (isTopic(key) || isGuide(key)) {
    const page = isTopic(key) ? content.topics[key] : content.guides[key]
    return { meta: page.meta, h1: page.h1, label: page.breadcrumb, card: page.card }
  }
  if (isHub(key)) {
    const page = content.hubs[key]
    return {
      meta: page.meta,
      h1: page.h1,
      label: page.breadcrumb,
      card: { title: page.breadcrumb, text: page.meta.description },
    }
  }
  if (isLegal(key)) {
    const document = content.legal[key]
    return {
      meta: { title: `${document.title} · ${SITE.name}`, description: document.description },
      h1: document.title,
      label: document.title,
      card: { title: document.title, text: document.description },
    }
  }
  const page = content[key]
  const label = key === 'home' ? content.common.breadcrumbHome : content.common.pageNames[key]
  return {
    meta: page.meta,
    h1: page.h1,
    label,
    card: { title: content.common.pageNames[key], text: page.meta.description },
  }
}
