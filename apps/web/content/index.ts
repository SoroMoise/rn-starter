import type { Locale } from '@/lib/i18n'
import { enLegal } from './en/legal'
import { enSite } from './en/site'
import { frLegal } from './fr/legal'
import { frSite } from './fr/site'
import type { LegalContent, SiteContent } from './types'

const SITE_CONTENT: Record<Locale, SiteContent> = { en: enSite, fr: frSite }
const LEGAL_CONTENT: Record<Locale, LegalContent> = { en: enLegal, fr: frLegal }

export function getSiteContent(locale: Locale): SiteContent {
  return SITE_CONTENT[locale]
}

export function getLegalContent(locale: Locale): LegalContent {
  return LEGAL_CONTENT[locale]
}
