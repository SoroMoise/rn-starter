import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getContent, pageInfo } from '@/content'
import { LOCALES, type Locale } from '@/lib/i18n'
import { isRouteKey, ROUTE_KEYS, type RouteKey } from '@/lib/routes'
import { SITE } from '@/lib/site'

export const dynamic = 'force-static'
export const dynamicParams = false

const SIZE = { width: 1200, height: 630 }

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    ROUTE_KEYS.map((route) => ({ file: `${locale}-${route}.png` }))
  )
}

function parse(file: string): { locale: Locale; route: RouteKey } | null {
  const match = /^([a-z]{2})-(.+)\.png$/.exec(file)
  if (!match) return null
  const [, locale, route] = match
  if (!locale || !route || !(LOCALES as readonly string[]).includes(locale) || !isRouteKey(route)) {
    return null
  }
  return { locale: locale as Locale, route }
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const parsed = parse((await params).file)
  if (!parsed) return new Response('Not found', { status: 404 })
  const { locale, route } = parsed
  const title = pageInfo({ key: route, locale }).h1
  const tagline = getContent(locale).common.ogTagline
  const icon = await readFile(join(process.cwd(), 'app/icon.png'))
  const iconSrc = `data:image/png;base64,${icon.toString('base64')}`
  const titleSize = title.length > 70 ? 52 : title.length > 45 ? 60 : 68

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '56px 64px 56px',
          background:
            'radial-gradient(circle at 92% 0%, rgba(96, 165, 250, 0.3), rgba(10, 10, 15, 0) 55%), #0a0a0f',
          color: '#f3f4f6',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconSrc} width={72} height={72} alt="" style={{ borderRadius: 16 }} />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>{SITE.name}</div>
        </div>
        <div
          style={{
            display: 'flex',
            maxWidth: 1040,
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#a1a1aa' }}>{tagline}</div>
      </div>
    ),
    SIZE
  )
}
