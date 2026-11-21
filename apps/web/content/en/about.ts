import { SITE } from '@/lib/site'
import type { AboutContent } from '../types'

export const about: AboutContent = {
  meta: {
    title: `About ${SITE.name}`,
    description: `Who makes ${SITE.name}, why, and how to reach us.`,
  },
  eyebrow: 'About',
  h1: `About ${SITE.name}`,
  lead: `${SITE.name} is made by ${SITE.publisher}. [Why the app exists, in one sentence.]`,
  sections: [
    {
      title: 'Why we built it',
      blocks: [{ type: 'p', text: '[The problem the app solves, and for whom.]' }],
    },
    {
      title: 'What we promise',
      blocks: [
        {
          type: 'list',
          items: [
            'No account, and nothing sold.',
            '[A promise the app keeps]',
            'The site never claims more than the app does.',
          ],
        },
      ],
    },
    {
      title: 'Contact',
      blocks: [
        {
          type: 'p',
          text: `Write to [${SITE.supportEmail}](mailto:${SITE.supportEmail}), saying which phone and which version of the app you use.`,
        },
      ],
    },
  ],
}
