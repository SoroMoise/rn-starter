import { FACTS } from '@/lib/facts'
import { SITE } from '@/lib/site'
import type { FeaturesContent } from '../types'

export const features: FeaturesContent = {
  meta: {
    title: `Features · ${SITE.name}`,
    description: `Everything ${SITE.name} does on Android: [the three main features], with what is free and what is Pro.`,
  },
  eyebrow: 'Features',
  h1: `Everything ${SITE.name} does`,
  lead: '[One sentence on what the features add up to.]',
  groups: {
    essentials: {
      title: 'The essentials',
      lead: '[What every user gets, for free.]',
    },
    pro: {
      title: 'With Pro',
      lead: 'What the optional upgrade adds.',
    },
  },
  items: {
    featureOne: { title: '[Feature one]', text: '[What it does, in the user’s words.]' },
    featureTwo: { title: '[Feature two]', text: '[What it does.]' },
    featureThree: { title: '[Feature three]', text: '[What it does.]' },
    noAccount: {
      title: 'No account',
      text: 'Open the app and start: no sign-up, no e-mail, and your settings stay on your phone.',
    },
    noAds: {
      title: 'No ads',
      text: 'Pro removes every ad from the app for as long as it is active.',
    },
    proFeature: { title: '[A Pro feature not shipped yet]', text: '[What it will do.]' },
  },
  specsTitle: 'Specifications',
  specs: [
    { label: 'Platform', value: `Android ${FACTS.androidVersion} or later` },
    { label: 'Price', value: 'Free, with an optional Pro upgrade · [Free and Pro](pricing)' },
    { label: 'Account', value: 'None' },
    { label: 'App languages', value: `${FACTS.appLanguages}` },
  ],
  soonTitle: 'Coming later',
  soonText:
    'These features are planned, not shipped: the site lists them so nobody installs the app for them.',
}
