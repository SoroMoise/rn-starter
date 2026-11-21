import Link from 'next/link'
import { getContent, pageInfo } from '@/content'
import { HTML_LANG, LOCALE_LABEL, LOCALES, type Locale } from '@/lib/i18n'
import { HUB_CHILDREN } from '@/lib/pageTree'
import { feedPath, ROUTES, type RouteKey } from '@/lib/routes'
import { SITE } from '@/lib/site'
import { Typeset } from '../content/RichText'
import { AppIcon } from '../ui/AppIcon'
import { StoreButton } from '../ui/StoreButton'

type FooterLink = { href: string; label: string; lang?: string; plain?: boolean }

export function SiteFooter({ locale, route }: { locale: Locale; route: RouteKey }) {
  const { common } = getContent(locale)
  const { footer } = common
  const page = (key: RouteKey): FooterLink => ({
    href: ROUTES[key][locale],
    label: pageInfo({ key, locale }).label,
  })

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: footer.product,
      links: (['features', 'pricing', 'faq', 'about'] as const).map(page),
    },
    {
      title: footer.useCases,
      links: (['useCases', ...HUB_CHILDREN.useCases] as const).map(page),
    },
    {
      title: footer.resources,
      links: [
        page('guides'),
        { href: feedPath(locale), label: footer.rss, plain: true },
        { href: `mailto:${SITE.supportEmail}`, label: footer.contact, plain: true },
        page('privacy'),
        page('terms'),
        ...LOCALES.filter((other) => other !== locale).map((other) => ({
          href: ROUTES[route][other],
          label: LOCALE_LABEL[other],
          lang: HTML_LANG[other],
        })),
      ],
    },
  ]

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href={ROUTES.home[locale]} className="brand">
              <AppIcon size={32} />
              <span>{SITE.name}</span>
            </Link>
            <p>
              <Typeset text={common.appDefinition} locale={locale} />
            </p>
            <div>
              <StoreButton locale={locale} route={route} placement="footer" size="sm" short />
            </div>
          </div>
          <div className="footer-cols">
            {columns.map((column) => (
              <nav key={column.title} className="footer-col" aria-label={column.title}>
                <h2>{column.title}</h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      {link.plain ? (
                        <a href={link.href}>{link.label}</a>
                      ) : (
                        <Link href={link.href} hrefLang={link.lang} lang={link.lang}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {SITE.publisher}. {footer.rights}
          </p>
          <p>{footer.trademarks}</p>
        </div>
      </div>
    </footer>
  )
}
