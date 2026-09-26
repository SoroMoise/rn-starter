import { SITE } from '@/lib/site'
import type { LegalContent } from '../types'

export const frLegal: LegalContent = {
  privacy: {
    title: 'Politique de confidentialité',
    description: `Comment ${SITE.name} traite vos données.`,
    intro: [`${SITE.name} est éditée par ${SITE.publisher}.`],
    sections: [{ title: 'Contact', paragraphs: [`Écrivez à ${SITE.supportEmail}.`] }],
  },
  terms: {
    title: 'Conditions d’utilisation',
    description: `Les conditions qui régissent votre utilisation de ${SITE.name}.`,
    intro: [
      `Ces conditions régissent votre utilisation de ${SITE.name}, éditée par ${SITE.publisher}.`,
    ],
    sections: [{ title: 'Contact', paragraphs: [`Écrivez à ${SITE.supportEmail}.`] }],
  },
}
