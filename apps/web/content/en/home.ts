import { SITE } from '@/lib/site'
import type { HomeContent } from '../types'

export const home: HomeContent = {
  meta: {
    title: `${SITE.name}: [main keyword, the words people search] on Android`,
    description: `${SITE.name} is a free Android app that [does what]. [The second benefit], no account. [About 150 characters in all.]`,
  },
  eyebrow: '[Category] for Android',
  h1: '[The main keyword phrased as the promise]',
  lead: `**${SITE.name}** [answers the question the visitor came with in its first sentence: what it does, for whom]. [Then the one detail that sets it apart.]`,
  reassurance: ['Free to start', 'No account', '[A third reassurance]'],
  stepsTitle: 'How it works',
  steps: [
    { title: '[First step]', text: '[What the user does, in one sentence.]' },
    { title: '[Second step]', text: '[What the app does for them.]' },
    { title: '[Third step]', text: '[What they get at the end.]' },
  ],
  featuresTitle: 'What it does',
  featuresLead: '[One sentence that sums up the features below.]',
  featureIds: ['featureOne', 'featureTwo', 'featureThree', 'noAccount', 'noAds'],
  trustEyebrow: 'Privacy',
  trustTitle: 'No account. Your data stays on your phone.',
  trustLead:
    'What the app stores stays in its private storage on your device, and uninstalling it deletes it. [Say plainly what, if anything, leaves the phone.] · [Privacy policy](privacy)',
  trustPoints: [
    {
      icon: 'userOff',
      title: 'No account',
      text: 'No sign-up, no e-mail address, no password.',
    },
    {
      icon: 'shield',
      title: 'Nothing sold',
      text: 'We do not sell your data, to advertisers or anyone else.',
    },
    {
      icon: 'offline',
      title: '[Third promise]',
      text: '[One sentence the privacy policy backs.]',
    },
  ],
  useCasesTitle: 'What people use it for',
  useCasesLead: '[One sentence on who the app is for.] · [Every use case](useCases)',
  plansTitle: 'Free, with Pro when you want more',
  plansLead: 'Start for free. Pro is optional, and the store shows its price before you pay.',
  faqIds: ['what-is', 'free', 'account', 'iphone'],
}
