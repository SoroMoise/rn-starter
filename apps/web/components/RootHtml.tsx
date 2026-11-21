import type { Viewport } from 'next'
import type { ReactNode } from 'react'
import { HTML_LANG, type Locale } from '@/lib/i18n'
import { THEME_COLOR, THEME_SCRIPT } from '@/lib/theme'
import '@/app/globals.css'

export const VIEWPORT: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR.dark },
  ],
}

export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={HTML_LANG[locale]} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
      </body>
    </html>
  )
}
