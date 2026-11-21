import { FACTS } from '@/lib/facts'
import { SITE } from '@/lib/site'
import type { FaqContent } from '../types'

export const faq: FaqContent = {
  meta: {
    title: `FAQ ${SITE.name} : [les questions que l’on se pose]`,
    description: `Réponses sur ${SITE.name} : ce qu’elle fait, ce qui est gratuit, la confidentialité, Pro et l’iPhone.`,
  },
  eyebrow: 'FAQ',
  h1: 'Questions fréquentes',
  lead: `Chaque réponse se suffit à elle-même. Une question manque ? Écrivez à ${SITE.supportEmail}.`,
  groups: [
    {
      id: 'essentiel',
      title: 'L’essentiel',
      items: [
        {
          id: 'what-is',
          q: `Qu’est-ce que ${SITE.name} ?`,
          a: `${SITE.name} est une application Android gratuite qui [fait quoi, pour qui]. [Le détail qui la distingue.]`,
        },
        {
          id: 'free',
          q: `${SITE.name} est-elle gratuite ?`,
          a: `Oui. ${SITE.name} est gratuite à télécharger et à utiliser, avec des publicités. L’offre Pro, facultative, les retire [et ajoute quoi]. · [Gratuit et Pro](pricing)`,
        },
        {
          id: 'iphone',
          q: `${SITE.name} existe-t-elle sur iPhone ?`,
          a: `Pas encore. ${SITE.name} fonctionne sous Android ${FACTS.androidVersion} ou version ultérieure, depuis Google Play.`,
        },
      ],
    },
    {
      id: 'confidentialite',
      title: 'Confidentialité',
      items: [
        {
          id: 'account',
          q: `Faut-il un compte pour utiliser ${SITE.name} ?`,
          a: 'Non. Aucune inscription, aucune adresse e-mail à donner. Vos réglages restent sur votre téléphone, et désinstaller l’app les efface.',
        },
        {
          q: `${SITE.name} vend-elle mes données ?`,
          a: 'Non. La version gratuite affiche des publicités Google AdMob, qui demande d’abord votre accord là où la loi l’exige, et Pro les retire. · [Politique de confidentialité](privacy)',
        },
      ],
    },
  ],
}
