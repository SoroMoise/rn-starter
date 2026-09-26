import { SITE } from '@/lib/site'
import type { SiteContent } from '../types'

export const frSite: SiteContent = {
  nav: {
    home: 'Accueil',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    support: 'Assistance',
  },
  home: {
    title: `${SITE.name} — [une ligne qui dit ce que fait l’app]`,
    description:
      '[Une ou deux phrases pour les résultats de recherche : ce que fait l’app, et pour qui.]',
    tagline: '[Ce que fait l’app, en une phrase.]',
    body: '[Un court paragraphe : à qui s’adresse l’app, et ce qu’elle change pour eux.]',
    storeCta: 'Disponible sur Google Play',
  },
  legal: {
    updated: 'Dernière mise à jour',
    templateNotice:
      'Modèle. Les passages entre crochets sont à remplacer : complétez-les, retirez ce que l’app ne fait pas, et faites relire l’ensemble avant la mise en ligne.',
  },
  notFound: {
    title: 'Page introuvable',
    body: 'Cette page n’existe pas, ou plus.',
    cta: 'Retour à l’accueil',
  },
}
