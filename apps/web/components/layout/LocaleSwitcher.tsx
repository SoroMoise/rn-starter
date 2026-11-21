import Link from 'next/link'
import { HTML_LANG, LOCALE_LABEL, LOCALE_SHORT, LOCALES, type Locale } from '@/lib/i18n'
import { ROUTES, type RouteKey } from '@/lib/routes'

export function LocaleSwitcher({
  locale,
  route,
  label,
}: {
  locale: Locale
  route: RouteKey
  label: string
}) {
  if (LOCALES.length < 2) return null

  return (
    <nav aria-label={label} className="switcher">
      {LOCALES.map((item) => (
        <Link
          key={item}
          href={ROUTES[route][item]}
          hrefLang={HTML_LANG[item]}
          lang={HTML_LANG[item]}
          className="switcher-item"
          aria-current={item === locale ? 'true' : undefined}
          aria-label={LOCALE_LABEL[item]}
          title={LOCALE_LABEL[item]}>
          {LOCALE_SHORT[item]}
        </Link>
      ))}
    </nav>
  )
}
