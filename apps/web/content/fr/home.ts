import { SITE } from '@/lib/site'
import type { HomeContent } from '../types'

export const home: HomeContent = {
  meta: {
    title: `${SITE.name} : [mot-clé principal, les mots que l’on cherche] sur Android`,
    description: `${SITE.name} est une application Android gratuite qui [fait quoi]. [Le deuxième bénéfice], sans compte. [Environ 150 caractères en tout.]`,
  },
  eyebrow: '[Catégorie] pour Android',
  h1: '[Le mot-clé principal formulé comme une promesse]',
  lead: `**${SITE.name}** [répond dès sa première phrase à la question du visiteur : ce qu’elle fait, pour qui]. [Puis le détail qui la distingue.]`,
  reassurance: ['Gratuit pour commencer', 'Sans compte', '[Une troisième garantie]'],
  stepsTitle: 'Comment ça marche',
  steps: [
    { title: '[Première étape]', text: '[Ce que fait l’utilisateur, en une phrase.]' },
    { title: '[Deuxième étape]', text: '[Ce que l’app fait pour lui.]' },
    { title: '[Troisième étape]', text: '[Ce qu’il obtient à la fin.]' },
  ],
  featuresTitle: 'Ce qu’elle fait',
  featuresLead: '[Une phrase qui résume les fonctionnalités ci-dessous.]',
  featureIds: ['featureOne', 'featureTwo', 'featureThree', 'noAccount', 'noAds'],
  trustEyebrow: 'Confidentialité',
  trustTitle: 'Sans compte. Vos données restent sur votre téléphone.',
  trustLead:
    'Ce que l’application enregistre reste dans son espace privé sur votre appareil, et la désinstaller l’efface. [Dites simplement ce qui en sort, s’il y a quelque chose.] · [Politique de confidentialité](privacy)',
  trustPoints: [
    {
      icon: 'userOff',
      title: 'Aucun compte',
      text: 'Pas d’inscription, pas d’adresse e-mail, pas de mot de passe.',
    },
    {
      icon: 'shield',
      title: 'Rien n’est vendu',
      text: 'Nous ne vendons pas vos données, ni aux annonceurs ni à personne.',
    },
    {
      icon: 'offline',
      title: '[Troisième promesse]',
      text: '[Une phrase que la politique de confidentialité confirme.]',
    },
  ],
  useCasesTitle: 'À quoi elle sert',
  useCasesLead: '[Une phrase sur le public de l’app.] · [Tous les cas d’usage](useCases)',
  plansTitle: 'Gratuite, avec Pro quand vous voulez plus',
  plansLead:
    'Commencez gratuitement. Pro est facultatif, et la boutique affiche son prix avant tout paiement.',
  faqIds: ['what-is', 'free', 'account', 'iphone'],
}
