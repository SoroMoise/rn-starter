import type { ReactNode } from 'react'
import { HTML_LANG, type Locale } from '@/lib/i18n'
import '@/app/globals.css'

// Only a root layout renders <html lang>, so each locale has its own and both render this. No theme
// script: `color-scheme: light dark` follows the system from the first paint, with nothing to run.
export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={HTML_LANG[locale]}>
      <body>{children}</body>
    </html>
  )
}
