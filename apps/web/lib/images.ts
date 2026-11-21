import type { Locale } from './i18n'

export type Screenshot = {
  src: string
  width: number
  height: number
  alt: Record<Locale, string>
}

export const SCREENSHOTS: readonly Screenshot[] = []
