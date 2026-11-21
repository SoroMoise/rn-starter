import { SITE } from '@/lib/site'
import type { TopicPage } from '../../types'

export const useCaseExample: TopicPage = {
  meta: {
    title: `[Keyword people search] on Android · ${SITE.name}`,
    description: `[Answer the search in one sentence, naming ${SITE.name}.]`,
  },
  breadcrumb: '[Use case]',
  card: {
    title: '[Use case]',
    text: '[One sentence for the card that links here.]',
  },
  icon: 'sparkle',
  eyebrow: 'Use case',
  h1: '[The keyword, phrased as what the reader wants to do]',
  lead: `[The answer first: how ${SITE.name} does it, in one or two sentences.]`,
  highlights: ['[Benefit]', '[Benefit]', 'No account'],
  sections: [
    {
      title: '[How to do it with the app]',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: '[Step one]', text: '[What to tap.]' },
            { title: '[Step two]', text: '[What happens.]' },
          ],
        },
        { type: 'cta' },
      ],
    },
    {
      title: '[What to expect]',
      blocks: [
        { type: 'p', text: '[What it does well.]' },
        {
          type: 'callout',
          tone: 'limit',
          text: '[What it does not do: say it before the reader finds out.]',
        },
      ],
    },
  ],
  faq: [
    {
      q: '[A question people ask about this use case]',
      a: '[An answer that stands on its own and names the app.]',
    },
  ],
  related: ['guideExample', 'features'],
}
