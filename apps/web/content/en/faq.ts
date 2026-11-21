import { FACTS } from '@/lib/facts'
import { SITE } from '@/lib/site'
import type { FaqContent } from '../types'

export const faq: FaqContent = {
  meta: {
    title: `${SITE.name} FAQ: [the questions people ask]`,
    description: `Answers about ${SITE.name}: what it does, what is free, privacy, Pro and the iPhone.`,
  },
  eyebrow: 'FAQ',
  h1: 'Frequently asked questions',
  lead: `Each answer stands on its own. Something missing? Write to ${SITE.supportEmail}.`,
  groups: [
    {
      id: 'basics',
      title: 'The basics',
      items: [
        {
          id: 'what-is',
          q: `What is ${SITE.name}?`,
          a: `${SITE.name} is a free Android app that [does what, for whom]. [The one detail that sets it apart.]`,
        },
        {
          id: 'free',
          q: `Is ${SITE.name} free?`,
          a: `Yes. ${SITE.name} is free to download and use, with ads. The optional Pro upgrade removes them [and adds what]. · [Free and Pro](pricing)`,
        },
        {
          id: 'iphone',
          q: `Is ${SITE.name} available on iPhone?`,
          a: `Not yet. ${SITE.name} runs on Android ${FACTS.androidVersion} or later, from Google Play.`,
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy',
      items: [
        {
          id: 'account',
          q: `Do I need an account to use ${SITE.name}?`,
          a: 'No. There is no sign-up and no e-mail address to give. Your settings stay on your phone, and uninstalling the app deletes them.',
        },
        {
          q: `Does ${SITE.name} sell my data?`,
          a: 'No. The free version shows ads through Google AdMob, which asks for your consent first where the law requires it, and Pro removes the ads. · [Privacy policy](privacy)',
        },
      ],
    },
  ],
}
