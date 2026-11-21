import { FACTS } from '@/lib/facts'
import { SITE } from '@/lib/site'
import type { CommonContent } from '../types'

export const common: CommonContent = {
  appDefinition: `${SITE.name} is a free Android app that [does what, for whom, in one sentence].`,
  skipToContent: 'Skip to content',
  pageNames: {
    home: 'Home',
    features: 'Features',
    pricing: 'Pricing',
    faq: 'FAQ',
    about: 'About',
  },
  nav: {
    label: 'Main',
    features: 'Features',
    pricing: 'Pricing',
    guides: 'Guides',
    faq: 'FAQ',
    menu: 'Menu',
  },
  cta: {
    store: 'Get it on Google Play',
    storeShort: 'Get the app',
    storeSub: 'Free · Android {android} or later',
    learnMore: 'Learn more',
    readGuide: 'Read the guide',
    seeAll: 'See every feature',
  },
  badges: {
    pro: 'Pro',
    soon: 'Coming soon',
    free: 'Free',
  },
  footer: {
    product: 'Product',
    useCases: 'Use cases',
    resources: 'Resources',
    contact: 'Contact',
    rss: 'Guides feed (RSS)',
    rights: 'All rights reserved.',
    trademarks: 'Google Play and Android are trademarks of Google LLC.',
  },
  breadcrumbHome: 'Home',
  breadcrumbLabel: 'Breadcrumb',
  aside: {
    title: '[Short pitch, four words]',
    points: [
      'Free on Android, no account',
      '[A promise the app keeps]',
      '[Another one]',
      `Available in ${FACTS.appLanguages} languages`,
    ],
  },
  onThisPage: 'On this page',
  related: 'Keep reading',
  faqTitle: 'Frequently asked questions',
  updated: 'Updated',
  readingTime: '{minutes} min read',
  takeaways: 'Key takeaways',
  finalCta: {
    title: '[The promise, in a few words]',
    text: '[One sentence: what the user gets by installing now.]',
    note: 'An iPhone version is not available yet · [Free and Pro](pricing)',
  },
  legal: {
    updated: 'Last updated:',
    templateNotice:
      'Template. The bracketed passages are placeholders: fill them in, remove what the app does not do, and have the whole text reviewed before the site goes live.',
  },
  notFound: {
    title: 'Page not found',
    body: 'This page does not exist, or no longer does.',
    cta: 'Back to the home page',
  },
  ogTagline: 'Android · Free · No account',
}
