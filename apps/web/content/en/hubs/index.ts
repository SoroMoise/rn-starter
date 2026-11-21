import type { HubKey } from '@/lib/pageTree'
import { SITE } from '@/lib/site'
import type { HubPage } from '../../types'

export const hubs: Record<HubKey, HubPage> = {
  useCases: {
    meta: {
      title: `What ${SITE.name} is for: [use cases]`,
      description: `How people use ${SITE.name}: [use case one], [use case two] and more.`,
    },
    breadcrumb: 'Use cases',
    eyebrow: 'Use cases',
    h1: `What people use ${SITE.name} for`,
    lead: '[One sentence on the situations the app is made for.]',
    sections: [],
    faq: [],
  },
  guides: {
    meta: {
      title: `Guides · ${SITE.name}`,
      description: '[Practical guides on the topic the app serves, answered in plain words.]',
    },
    breadcrumb: 'Guides',
    eyebrow: 'Guides',
    h1: '[Guides on the topic the app serves]',
    lead: '[What these guides help with.] Each one opens on the short answer.',
    sections: [],
    faq: [],
  },
}
