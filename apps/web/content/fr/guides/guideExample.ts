import { SITE } from '@/lib/site'
import type { GuidePage } from '../../types'

export const guideExample: GuidePage = {
  meta: {
    title: '[Comment faire X sur Android : la question que l’on tape]',
    description: '[La réponse courte, en 150 caractères environ.]',
  },
  breadcrumb: '[Nom court du guide]',
  card: {
    title: '[Titre du guide]',
    text: '[Une phrase pour la carte qui mène ici.]',
  },
  h1: '[Comment faire X sur Android]',
  lead: '[La réponse en deux phrases, avant tout détail : les moteurs de réponse citent la première phrase qui règle la question.]',
  published: '2026-11-21',
  updated: '2026-11-21',
  takeaways: ['[Ce qu’il faut retenir]', '[Un deuxième point]', `[Où ${SITE.name} aide](features)`],
  sections: [
    {
      title: '[Pourquoi cela arrive]',
      blocks: [{ type: 'p', text: '[L’explication, avec des chiffres vérifiables.]' }],
    },
    {
      title: '[Comment y remédier, étape par étape]',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: '[Première étape]', text: '[Faites ceci.]' },
            { title: '[Deuxième étape]', text: '[Puis cela.]' },
            { title: '[Troisième étape]', text: '[Vérifiez ceci.]' },
          ],
        },
        { type: 'cta', text: `[Là où ${SITE.name} le fait pour vous.]` },
      ],
    },
    {
      title: '[Erreurs fréquentes]',
      blocks: [
        { type: 'list', items: ['[Erreur]', '[Erreur]'] },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Astuce',
          text: '[Une astuce qui mérite un encadré.]',
        },
      ],
    },
  ],
  faq: [{ q: '[Une question à laquelle le guide répond]', a: '[Une réponse autonome.]' }],
  related: ['useCaseExample', 'faq'],
  howTo: {
    name: '[Comment faire X sur Android]',
    steps: [
      { name: '[Première étape]', text: '[Faites ceci.]' },
      { name: '[Deuxième étape]', text: '[Puis cela.]' },
      { name: '[Troisième étape]', text: '[Vérifiez ceci.]' },
    ],
  },
}
