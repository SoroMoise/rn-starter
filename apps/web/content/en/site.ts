import { SITE } from '@/lib/site'
import type { SiteContent } from '../types'

export const enSite: SiteContent = {
  nav: {
    home: 'Home',
    privacy: 'Privacy',
    terms: 'Terms',
    support: 'Support',
  },
  home: {
    title: `${SITE.name} — [one line saying what the app does]`,
    description: '[One or two sentences for search results: what the app does, and for whom.]',
    tagline: '[What the app does, in one sentence.]',
    body: '[A short paragraph on who the app is for and what it changes for them.]',
    storeCta: 'Get it on Google Play',
  },
  legal: {
    updated: 'Last updated',
    templateNotice:
      'Template. The bracketed passages are placeholders: fill them in, remove what the app does not do, and have the whole text reviewed before the site goes live.',
  },
  notFound: {
    title: 'Page not found',
    body: 'This page does not exist, or no longer does.',
    cta: 'Back to the home page',
  },
}
