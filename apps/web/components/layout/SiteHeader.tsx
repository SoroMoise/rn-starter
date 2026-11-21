import Link from 'next/link'
import { getContent } from '@/content'
import { HTML_LANG, LOCALE_LABEL, LOCALE_SHORT, LOCALES, type Locale } from '@/lib/i18n'
import { parentOf } from '@/lib/pageTree'
import { ROUTES, type RouteKey } from '@/lib/routes'
import { SITE } from '@/lib/site'
import { AppIcon } from '../ui/AppIcon'
import { Icon } from '../ui/Icon'
import { StoreButton } from '../ui/StoreButton'
import { MobileMenu } from './MobileMenu'

const NAV_ITEMS = ['features', 'pricing', 'guides', 'faq'] as const

function isCurrent({ item, route }: { item: RouteKey; route: RouteKey }): boolean {
  return item === route || parentOf(route) === item
}

export function SiteHeader({ locale, route }: { locale: Locale; route: RouteKey }) {
  const { nav } = getContent(locale).common
  const others = LOCALES.filter((other) => other !== locale)

  const links = NAV_ITEMS.map((item) => ({
    item,
    href: ROUTES[item][locale],
    label: nav[item],
    current: isCurrent({ item, route }),
  }))

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href={ROUTES.home[locale]} className="brand">
          <AppIcon size={32} />
          <span>{SITE.name}</span>
        </Link>
        <nav className="primary-nav" aria-label={nav.label}>
          <ul>
            {links.map((link) => (
              <li key={link.item}>
                <Link href={link.href} aria-current={link.current ? 'page' : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          {others.map((other) => (
            <Link
              key={other}
              className="language-link"
              href={ROUTES[route][other]}
              hrefLang={HTML_LANG[other]}
              lang={HTML_LANG[other]}
              aria-label={LOCALE_LABEL[other]}>
              <Icon name="globe" size={18} />
              {LOCALE_SHORT[other]}
            </Link>
          ))}
          <StoreButton locale={locale} route={route} placement="header" size="sm" short />
        </div>
        <MobileMenu key={route}>
          <summary aria-label={nav.menu}>
            <Icon name="menu" className="menu-open" />
            <Icon name="cross" className="menu-close" />
          </summary>
          <div className="mobile-panel">
            <nav aria-label={nav.label}>
              <ul>
                {links.map((link) => (
                  <li key={link.item}>
                    <Link href={link.href} aria-current={link.current ? 'page' : undefined}>
                      {link.label}
                      <Icon name="chevronRight" size={18} className="flip-rtl" />
                    </Link>
                  </li>
                ))}
                {others.map((other) => (
                  <li key={other}>
                    <Link
                      href={ROUTES[route][other]}
                      hrefLang={HTML_LANG[other]}
                      lang={HTML_LANG[other]}>
                      {LOCALE_LABEL[other]}
                      <Icon name="globe" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mobile-actions">
              <StoreButton locale={locale} route={route} placement="menu" block />
            </div>
          </div>
        </MobileMenu>
      </div>
    </header>
  )
}
