import { FACTS } from '@/lib/facts'
import { SITE } from '@/lib/site'
import type { FeaturesContent } from '../types'

export const features: FeaturesContent = {
  meta: {
    title: `Fonctionnalités · ${SITE.name}`,
    description: `Tout ce que fait ${SITE.name} sur Android : [les trois fonctionnalités principales], avec ce qui est gratuit et ce qui est Pro.`,
  },
  eyebrow: 'Fonctionnalités',
  h1: `Tout ce que fait ${SITE.name}`,
  lead: '[Une phrase sur ce que les fonctionnalités apportent ensemble.]',
  groups: {
    essentials: {
      title: 'L’essentiel',
      lead: '[Ce que chacun obtient, gratuitement.]',
    },
    pro: {
      title: 'Avec Pro',
      lead: 'Ce qu’ajoute l’offre facultative.',
    },
  },
  items: {
    featureOne: {
      title: '[Fonctionnalité un]',
      text: '[Ce qu’elle fait, avec les mots de l’utilisateur.]',
    },
    featureTwo: { title: '[Fonctionnalité deux]', text: '[Ce qu’elle fait.]' },
    featureThree: { title: '[Fonctionnalité trois]', text: '[Ce qu’elle fait.]' },
    noAccount: {
      title: 'Sans compte',
      text: 'Ouvrez l’app et commencez : pas d’inscription, pas d’e-mail, et vos réglages restent sur votre téléphone.',
    },
    noAds: {
      title: 'Sans publicité',
      text: 'Pro retire toute publicité de l’application tant qu’il est actif.',
    },
    proFeature: { title: '[Une fonctionnalité Pro pas encore livrée]', text: '[Ce qu’elle fera.]' },
  },
  specsTitle: 'Caractéristiques',
  specs: [
    { label: 'Plateforme', value: `Android ${FACTS.androidVersion} ou version ultérieure` },
    {
      label: 'Prix',
      value: 'Gratuite, avec une offre Pro facultative · [Gratuit et Pro](pricing)',
    },
    { label: 'Compte', value: 'Aucun' },
    { label: 'Langues de l’app', value: `${FACTS.appLanguages}` },
  ],
  soonTitle: 'Plus tard',
  soonText:
    'Il n’existe pas encore de version iPhone. Ces fonctionnalités sont prévues, pas livrées : le site les cite pour que personne n’installe l’app pour elles.',
}
