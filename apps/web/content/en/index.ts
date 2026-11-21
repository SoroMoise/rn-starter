import type { SiteContent } from '../types'
import { about } from './about'
import { common } from './common'
import { faq } from './faq'
import { features } from './features'
import { guides } from './guides'
import { home } from './home'
import { hubs } from './hubs'
import { enLegal } from './legal'
import { pricing } from './pricing'
import { topics } from './topics'

export const en: SiteContent = {
  common,
  home,
  features,
  pricing,
  faq,
  about,
  hubs,
  topics,
  guides,
  legal: enLegal,
}
