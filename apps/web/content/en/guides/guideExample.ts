import { SITE } from '@/lib/site'
import type { GuidePage } from '../../types'

export const guideExample: GuidePage = {
  meta: {
    title: '[How to do X on Android: the question people type]',
    description: '[The short answer, in about 150 characters.]',
  },
  breadcrumb: '[Short guide name]',
  card: {
    title: '[Guide title]',
    text: '[One sentence for the card that links here.]',
  },
  h1: '[How to do X on Android]',
  lead: '[The answer in two sentences, before any detail: answer engines quote the first sentence that settles the question.]',
  published: '2026-11-21',
  updated: '2026-11-21',
  takeaways: ['[What to remember]', '[A second point]', `[Where ${SITE.name} helps](features)`],
  sections: [
    {
      title: '[Why it happens]',
      blocks: [{ type: 'p', text: '[The explanation, with figures that can be checked.]' }],
    },
    {
      title: '[How to fix it, step by step]',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: '[Step one]', text: '[Do this.]' },
            { title: '[Step two]', text: '[Then this.]' },
            { title: '[Step three]', text: '[Check this.]' },
          ],
        },
        { type: 'cta', text: `[Where ${SITE.name} does it for you.]` },
      ],
    },
    {
      title: '[Common mistakes]',
      blocks: [
        { type: 'list', items: ['[Mistake]', '[Mistake]'] },
        { type: 'callout', tone: 'tip', title: 'Tip', text: '[A tip worth a box.]' },
      ],
    },
  ],
  faq: [{ q: '[A question the guide answers]', a: '[A standalone answer.]' }],
  related: ['useCaseExample', 'faq'],
  howTo: {
    name: '[How to do X on Android]',
    steps: [
      { name: '[Step one]', text: '[Do this.]' },
      { name: '[Step two]', text: '[Then this.]' },
      { name: '[Step three]', text: '[Check this.]' },
    ],
  },
}
