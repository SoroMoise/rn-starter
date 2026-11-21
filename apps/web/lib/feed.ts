import { getContent } from '@/content'
import { HTML_LANG, type Locale } from './i18n'
import { GUIDE_KEYS } from './pageTree'
import { feedPath } from './routes'
import { SITE } from './site'
import { newestGuide } from './updated'
import { absoluteUrl, pageUrl } from './url'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function rfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString()
}

export function guidesFeed(locale: Locale): Response {
  const { guides, hubs } = getContent(locale)
  const hub = hubs.guides
  const newest = newestGuide(locale)

  const items = [...GUIDE_KEYS]
    .sort((a, b) => guides[b].published.localeCompare(guides[a].published))
    .map((key) => {
      const guide = guides[key]
      const url = pageUrl({ route: key, locale })
      return `<item><title>${escapeXml(guide.h1)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${escapeXml(guide.meta.description)}</description><pubDate>${rfc822(guide.published)}</pubDate></item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(hub.meta.title)}</title><link>${pageUrl({ route: 'guides', locale })}</link><description>${escapeXml(hub.meta.description)}</description><language>${HTML_LANG[locale]}</language><copyright>${escapeXml(SITE.publisher)}</copyright>${newest ? `<lastBuildDate>${rfc822(newest)}</lastBuildDate>` : ''}<atom:link href="${absoluteUrl(feedPath(locale))}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`

  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}
