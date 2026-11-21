import { SITE } from '@/lib/site'
import type { PricingContent } from '../types'

export const pricing: PricingContent = {
  meta: {
    title: `Tarifs · ${SITE.name} : gratuit, ou Pro sans publicité`,
    description: `${SITE.name} est gratuite sur Android, avec des publicités. Pro les retire [et ajoute quoi]. Le prix s’affiche dans l’app, dans votre devise.`,
  },
  eyebrow: 'Tarifs',
  h1: 'Gratuite. Pro quand vous voulez plus.',
  lead: `${SITE.name} est gratuite à télécharger et à utiliser. L’offre Pro, facultative, retire les publicités [et débloque quoi].`,
  freeTitle: 'Gratuit',
  freeLead: 'Tout le nécessaire pour [faire l’essentiel], avec des publicités.',
  freePoints: [
    '[Ce que comprend la version gratuite]',
    '[Sa limite, s’il y en a une]',
    'Sans compte',
  ],
  proTitle: 'Pro',
  proLead: 'Pour ceux qui [s’en servent tous les jours].',
  proPoints: [
    { icon: 'ban', title: 'Aucune publicité.', text: 'Toutes les publicités quittent l’app.' },
    {
      icon: 'diamond',
      title: '[Avantage Pro].',
      text: '[Ce qu’il change.]',
      feature: 'proFeature',
    },
  ],
  priceNote:
    'Les formules et leurs prix s’affichent dans l’app, dans votre devise, et Google Play les confirme avant le paiement. Résiliable à tout moment depuis Google Play.',
  tableTitle: 'Gratuit et Pro, côte à côte',
  tableHead: ['', 'Gratuit', 'Pro'],
  tableRows: [
    { label: 'Publicités', free: 'Oui', pro: 'Aucune' },
    { label: '[Fonctionnalité un]', free: 'Oui', pro: 'Oui' },
    { label: '[Fonctionnalité Pro]', free: '-', pro: 'Oui', feature: 'proFeature' },
  ],
  unlockTitle: 'Obtenir plus gratuitement',
  unlocks: [
    {
      title: 'Une pause sans publicité',
      text: 'Regardez une vidéo récompensée, facultative, pour suspendre les publicités un moment.',
    },
  ],
  faq: [
    {
      q: `Comment résilier ${SITE.name} Pro ?`,
      a: 'Dans Google Play : Paiements et abonnements, puis Abonnements. Les réglages de l’app renvoient vers cette page. Pro reste actif jusqu’à la fin de la période déjà payée, et désinstaller l’app ne le résilie pas.',
    },
    {
      q: 'J’ai changé de téléphone. Comment retrouver Pro ?',
      a: 'Installez l’app sur le nouveau téléphone avec le même compte Google : Pro revient de lui-même, et les réglages proposent une restauration sinon.',
    },
  ],
}
