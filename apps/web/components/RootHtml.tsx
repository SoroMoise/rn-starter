import type { Viewport } from 'next'
import type { ReactNode } from 'react'
import { HTML_LANG, type Locale } from '@/lib/i18n'
import '@/app/globals.css'

export const VIEWPORT: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
}

export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={HTML_LANG[locale]}>
      <body>{children}</body>
    </html>
  )
}
