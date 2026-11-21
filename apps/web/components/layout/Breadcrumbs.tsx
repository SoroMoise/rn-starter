import Link from 'next/link'
import { getContent, pageInfo } from '@/content'
import type { Locale } from '@/lib/i18n'
import { breadcrumbTrail } from '@/lib/pageTree'
import { ROUTES, type RouteKey } from '@/lib/routes'

export function Breadcrumbs({ locale, route }: { locale: Locale; route: RouteKey }) {
  const { breadcrumbLabel } = getContent(locale).common

  return (
    <nav className="breadcrumbs" aria-label={breadcrumbLabel}>
      <ol>
        {breadcrumbTrail(route).map((key) => {
          const { label } = pageInfo({ key, locale })
          return (
            <li key={key}>
              {key === route ? (
                <span aria-current="page">{label}</span>
              ) : (
                <Link href={ROUTES[key][locale]}>{label}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
