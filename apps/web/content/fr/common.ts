import { FACTS } from '@/lib/facts'
import { SITE } from '@/lib/site'
import type { CommonContent } from '../types'

export const common: CommonContent = {
  appDefinition: `${SITE.name} est une application Android gratuite qui [fait quoi, pour qui, en une phrase].`,
  skipToContent: 'Aller au contenu',
  pageNames: {
    home: 'Accueil',
    features: 'Fonctionnalités',
    pricing: 'Tarifs',
    faq: 'FAQ',
    about: 'À propos',
  },
  nav: {
    label: 'Navigation principale',
    features: 'Fonctionnalités',
    pricing: 'Tarifs',
    guides: 'Guides',
    faq: 'FAQ',
    menu: 'Menu',
  },
  cta: {
    store: 'Disponible sur Google Play',
    storeShort: 'Télécharger',
    storeSub: 'Gratuit · Android {android} ou version ultérieure',
    learnMore: 'En savoir plus',
    readGuide: 'Lire le guide',
    seeAll: 'Toutes les fonctionnalités',
  },
  badges: {
    pro: 'Pro',
    soon: 'Bientôt',
    free: 'Gratuit',
  },
  footer: {
    product: 'Produit',
    useCases: 'Cas d’usage',
    resources: 'Ressources',
    contact: 'Contact',
    rss: 'Flux des guides (RSS)',
    rights: 'Tous droits réservés.',
    trademarks: 'Google Play et Android sont des marques de Google LLC.',
  },
  breadcrumbHome: 'Accueil',
  breadcrumbLabel: 'Fil d’Ariane',
  aside: {
    title: '[Accroche courte, quatre mots]',
    points: [
      'Gratuit sur Android, sans compte',
      '[Une promesse que l’app tient]',
      '[Une autre]',
      `Disponible en ${FACTS.appLanguages} langues`,
    ],
  },
  onThisPage: 'Sur cette page',
  related: 'À lire aussi',
  faqTitle: 'Questions fréquentes',
  updated: 'Mis à jour le',
  readingTime: '{minutes} min de lecture',
  takeaways: 'À retenir',
  finalCta: {
    title: '[La promesse, en quelques mots]',
    text: '[Une phrase : ce que l’utilisateur obtient en installant maintenant.]',
    note: 'Pas encore de version iPhone · [Gratuit et Pro](pricing)',
  },
  legal: {
    updated: 'Dernière mise à jour :',
    templateNotice:
      'Modèle. Les passages entre crochets sont à remplacer : complétez-les, retirez ce que l’app ne fait pas, et faites relire l’ensemble avant la mise en ligne.',
  },
  notFound: {
    title: 'Page introuvable',
    body: 'Cette page n’existe pas, ou plus.',
    cta: 'Retour à l’accueil',
  },
  ogTagline: 'Android · Gratuit · Sans compte',
}
