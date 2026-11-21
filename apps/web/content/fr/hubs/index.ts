import type { HubKey } from '@/lib/pageTree'
import { SITE } from '@/lib/site'
import type { HubPage } from '../../types'

export const hubs: Record<HubKey, HubPage> = {
  useCases: {
    meta: {
      title: `À quoi sert ${SITE.name} : [cas d’usage]`,
      description: `Comment on utilise ${SITE.name} : [cas un], [cas deux] et d’autres.`,
    },
    breadcrumb: 'Cas d’usage',
    eyebrow: 'Cas d’usage',
    h1: `À quoi sert ${SITE.name}`,
    lead: '[Une phrase sur les situations pour lesquelles l’app est faite.]',
    sections: [],
    faq: [],
  },
  guides: {
    meta: {
      title: `Guides · ${SITE.name}`,
      description: '[Des guides pratiques sur le sujet de l’app, en termes simples.]',
    },
    breadcrumb: 'Guides',
    eyebrow: 'Guides',
    h1: '[Guides sur le sujet de l’app]',
    lead: '[Ce que ces guides aident à faire.] Chacun commence par la réponse courte.',
    sections: [],
    faq: [],
  },
}
