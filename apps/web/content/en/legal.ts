import { SITE } from '@/lib/site'
import type { LegalContent } from '../types'

export const enLegal: LegalContent = {
  privacy: {
    title: 'Privacy policy',
    description: `How ${SITE.name} handles your data.`,
    intro: [`${SITE.name} is published by ${SITE.publisher}.`],
    sections: [{ title: 'Contact', paragraphs: [`Write to ${SITE.supportEmail}.`] }],
  },
  terms: {
    title: 'Terms of service',
    description: `The terms that govern your use of ${SITE.name}.`,
    intro: [`These terms govern your use of ${SITE.name}, published by ${SITE.publisher}.`],
    sections: [{ title: 'Contact', paragraphs: [`Write to ${SITE.supportEmail}.`] }],
  },
}
