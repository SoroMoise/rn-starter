import { getContent } from '@/content'
import { FACTS } from '@/lib/facts'
import type { Locale } from '@/lib/i18n'
import type { RouteKey } from '@/lib/routes'
import { storeUrl, type StorePlacement } from '@/lib/store'
import { Icon } from './Icon'

export function StoreButton({
  locale,
  route,
  placement,
  size = 'md',
  short = false,
  block = false,
}: {
  locale: Locale
  route: RouteKey
  placement: StorePlacement
  size?: 'sm' | 'md'
  short?: boolean
  block?: boolean
}) {
  const { cta } = getContent(locale).common
  const classes = ['btn', 'btn--primary']
  if (size === 'sm') classes.push('btn--sm')
  if (block) classes.push('btn--block')

  return (
    <a className={classes.join(' ')} href={storeUrl({ locale, route, placement })} rel="noopener">
      <Icon name="download" size={size === 'sm' ? 18 : 20} />
      {short ? cta.storeShort : cta.store}
    </a>
  )
}

export function StoreCta({
  locale,
  route,
  placement,
  center = false,
}: {
  locale: Locale
  route: RouteKey
  placement: StorePlacement
  center?: boolean
}) {
  const { cta } = getContent(locale).common
  return (
    <div className={center ? 'store-cta store-cta--center' : 'store-cta'}>
      <StoreButton locale={locale} route={route} placement={placement} />
      <p className="store-note">{cta.storeSub.replace('{android}', FACTS.androidVersion)}</p>
    </div>
  )
}
