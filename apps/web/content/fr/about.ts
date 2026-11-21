import { SITE } from '@/lib/site'
import type { AboutContent } from '../types'

export const about: AboutContent = {
  meta: {
    title: `À propos de ${SITE.name}`,
    description: `Qui fait ${SITE.name}, pourquoi, et comment nous joindre.`,
  },
  eyebrow: 'À propos',
  h1: `À propos de ${SITE.name}`,
  lead: `${SITE.name} est éditée par ${SITE.publisher}. [Pourquoi l’app existe, en une phrase.]`,
  sections: [
    {
      title: 'Pourquoi nous l’avons faite',
      blocks: [{ type: 'p', text: '[Le problème que l’app résout, et pour qui.]' }],
    },
    {
      title: 'Nos engagements',
      blocks: [
        {
          type: 'list',
          items: [
            'Aucun compte, et rien n’est vendu.',
            '[Une promesse que l’app tient]',
            'Le site n’affirme jamais plus que ce que fait l’app.',
          ],
        },
      ],
    },
    {
      title: 'Contact',
      blocks: [
        {
          type: 'p',
          text: `Écrivez à [${SITE.supportEmail}](mailto:${SITE.supportEmail}) en précisant votre téléphone et la version de l’app.`,
        },
      ],
    },
  ],
}
