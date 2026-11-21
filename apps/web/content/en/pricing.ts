import { SITE } from '@/lib/site'
import type { PricingContent } from '../types'

export const pricing: PricingContent = {
  meta: {
    title: `Pricing · ${SITE.name}: free, or Pro without ads`,
    description: `${SITE.name} is free on Android, with ads. Pro removes them [and adds what]. The price is shown in the app, in your currency.`,
  },
  eyebrow: 'Pricing',
  h1: 'Free to use. Pro when you want more.',
  lead: `${SITE.name} is free to download and use. The optional Pro upgrade removes the ads [and unlocks what].`,
  freeTitle: 'Free',
  freeLead: 'Everything you need to [do the main job], with ads.',
  freePoints: ['[What the free version includes]', '[Its limit, if it has one]', 'No account'],
  proTitle: 'Pro',
  proLead: 'For people who [use it every day].',
  proPoints: [
    { icon: 'ban', title: 'No ads.', text: 'Every ad leaves the app.' },
    { icon: 'diamond', title: '[Pro benefit].', text: '[What it changes.]', feature: 'proFeature' },
  ],
  priceNote:
    'Plans and prices are shown in the app, in your currency, and confirmed by Google Play before you pay. Cancel any time from Google Play.',
  tableTitle: 'Free and Pro, side by side',
  tableHead: ['', 'Free', 'Pro'],
  tableRows: [
    { label: 'Ads', free: 'Yes', pro: 'None' },
    { label: '[Feature one]', free: 'Yes', pro: 'Yes' },
    { label: '[Pro feature]', free: '-', pro: 'Yes', feature: 'proFeature' },
  ],
  unlockTitle: 'Free ways to get more',
  unlocks: [
    {
      title: 'A break from ads',
      text: 'Watch an optional rewarded video to suspend the ads for a while.',
    },
  ],
  faq: [
    {
      q: `How do I cancel ${SITE.name} Pro?`,
      a: 'In Google Play: Payments and subscriptions, then Subscriptions. The app links to that page from its settings. Pro stays active until the end of the period already paid, and uninstalling the app does not cancel it.',
    },
    {
      q: 'I changed phones. How do I get Pro back?',
      a: 'Install the app on the new phone with the same Google account: Pro comes back on its own, and the settings offer a restore action if it does not.',
    },
  ],
}
