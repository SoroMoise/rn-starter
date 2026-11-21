import { SITE } from '@/lib/site'
import type { TopicPage } from '../../types'

export const useCaseExample: TopicPage = {
  meta: {
    title: `[Mot-clé recherché] sur Android · ${SITE.name}`,
    description: `[Répondez à la recherche en une phrase, en nommant ${SITE.name}.]`,
  },
  breadcrumb: '[Cas d’usage]',
  card: {
    title: '[Cas d’usage]',
    text: '[Une phrase pour la carte qui mène ici.]',
  },
  icon: 'sparkle',
  eyebrow: 'Cas d’usage',
  h1: '[Le mot-clé, formulé comme ce que le lecteur veut faire]',
  lead: `[La réponse d’abord : comment ${SITE.name} le fait, en une ou deux phrases.]`,
  highlights: ['[Bénéfice]', '[Bénéfice]', 'Sans compte'],
  sections: [
    {
      title: '[Comment faire avec l’app]',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: '[Première étape]', text: '[Où toucher.]' },
            { title: '[Deuxième étape]', text: '[Ce qui se passe.]' },
          ],
        },
        { type: 'cta' },
      ],
    },
    {
      title: '[À quoi s’attendre]',
      blocks: [
        { type: 'p', text: '[Ce qu’elle fait bien.]' },
        {
          type: 'callout',
          tone: 'limit',
          text: '[Ce qu’elle ne fait pas : dites-le avant que le lecteur ne le découvre.]',
        },
      ],
    },
  ],
  faq: [
    {
      q: '[Une question que l’on se pose sur ce cas]',
      a: '[Une réponse autonome qui nomme l’app.]',
    },
  ],
  related: ['guideExample', 'features'],
}
