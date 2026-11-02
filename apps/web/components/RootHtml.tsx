import type { ReactNode } from 'react'
import { HTML_LANG, type Locale } from '@/lib/i18n'
import '@/app/globals.css'

export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={HTML_LANG[locale]}>
      <body>{children}</body>
    </html>
  )
}
