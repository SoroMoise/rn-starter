import type { MetadataRoute } from 'next'
import { getContent } from '@/content'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { SITE } from '@/lib/site'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: getContent(DEFAULT_LOCALE).common.appDefinition,
    start_url: '/',
    display: 'browser',
    background_color: '#f9fafb',
    theme_color: '#1d4ed8',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
