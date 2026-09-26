import { SITE, STORE_URL } from '@/lib/site'
import type { LegalContent } from '../types'

export const frLegal: LegalContent = {
  privacy: {
    title: 'Politique de confidentialité',
    description: `Ce que ${SITE.name} collecte, ce qui reste sur votre appareil, quels prestataires reçoivent des données, et comment exercer vos droits.`,
    intro: [
      `${SITE.name} est une application mobile éditée par ${SITE.publisher}. Cette politique explique ce que l’application et ce site collectent, pourquoi, qui d’autre le reçoit, et ce que vous pouvez décider vous-même.`,
      'L’application ne demande aucun compte. L’essentiel de ce qu’elle enregistre ne quitte jamais votre appareil ; ce qui en sort, ce sont des données de publicité et de mesure d’audience, des rapports de plantage et, si vous achetez l’offre Pro, la trace de cet achat. Chacun est décrit ci-dessous.',
    ],
    sections: [
      {
        title: 'L’essentiel',
        paragraphs: ['Si vous ne lisez rien d’autre sur cette page, retenez ceci.'],
        list: [
          'Aucun compte, aucune inscription. Vos réglages restent sur votre téléphone, et désinstaller l’application les efface.',
          'La version gratuite affiche des publicités Google AdMob, qui lit l’identifiant publicitaire de votre appareil. Là où la loi l’exige, votre accord est demandé d’abord, et Pro supprime toute publicité.',
          'Google Firebase nous indique quelles fonctionnalités sont utilisées et quand l’application plante, sans savoir qui vous êtes.',
          'Un achat passe par votre boutique d’applications : nous ne voyons jamais vos données de paiement.',
          'Nous ne vendons pas vos données, et vous pouvez nous demander de consulter, corriger ou supprimer ce que nous détenons.',
        ],
      },
      {
        title: 'Qui est responsable de vos données',
        paragraphs: [
          `Le responsable du traitement des données décrites ici est ${SITE.publisher}, éditeur de l’application et de ce site. Pour poser une question ou exercer un droit, écrivez à ${SITE.supportEmail} en précisant votre appareil et la version de l’application, afin que nous retrouvions les bonnes informations.`,
        ],
      },
      {
        title: 'Ce que l’application collecte automatiquement',
        paragraphs: [
          'Les données suivantes sont collectées lorsque vous utilisez l’application, sans que vous ayez rien à saisir, par des kits de développement de Google et de RevenueCat intégrés à celle-ci. Elles sont décrites dans les termes qu’emploie Google, pour que vous puissiez les comparer à la section « Sécurité des données » de la fiche Google Play de l’application.',
        ],
        list: [
          'Identifiants de l’appareil ou autres : l’identifiant publicitaire de votre appareil, lu par Google AdMob ; un identifiant d’installation Firebase, qui regroupe les événements et les rapports de plantage par installation ; et un identifiant anonyme généré sur votre appareil pour RevenueCat. Aucun n’est votre nom ni votre adresse e-mail, et l’identifiant publicitaire peut être réinitialisé.',
          'Activité dans l’application : les écrans ouverts, les fonctionnalités utilisées, les offres qui vous sont présentées et la formule achetée avec son prix — jamais un identifiant de paiement —, collectés par Firebase Analytics.',
          'Informations sur l’application et performances : journaux de plantage et diagnostics — l’état de l’application et de l’appareil au moment d’une erreur —, collectés par Firebase Crashlytics, avec la langue et le thème de l’application.',
          'Informations techniques : modèle de l’appareil, versions du système et de l’application, langue du système, et une localisation approximative déduite de votre adresse IP, qu’AdMob utilise pour choisir les publicités.',
          'Historique d’achats : si vous achetez Pro, le produit acheté et le reçu émis par la boutique, reçus par RevenueCat.',
        ],
      },
      {
        title: 'Ce qui reste sur votre appareil',
        paragraphs: [
          'L’application conserve les éléments suivants dans son espace de stockage privé, sur votre téléphone. Nous ne pouvons pas les lire, et ils sont effacés lorsque vous videz les données de l’application ou la désinstallez.',
          'Android peut inclure vos préférences dans la sauvegarde de l’appareil conservée dans votre compte Google, afin qu’un nouveau téléphone les retrouve. La copie de votre statut Pro est exclue de cette sauvegarde : sur un nouvel appareil, la boutique le confirme à nouveau.',
        ],
        list: [
          'Vos préférences : langue, thème, et si vous avez terminé la présentation de l’application.',
          'Des compteurs qui servent à doser l’application : combien de fois vous l’avez ouverte, combien d’actions vous avez menées à bien, sa date d’installation, et la dernière fois qu’une offre ou une demande d’avis s’est affichée.',
          'Une copie chiffrée de votre statut Pro et de sa date d’expiration, pour que Pro fonctionne hors connexion.',
          'La fin d’une période sans publicité obtenue en regardant une vidéo récompensée.',
        ],
      },
      {
        title: 'Publicité Google AdMob',
        paragraphs: [
          'La version gratuite de l’application affiche des publicités fournies par Google AdMob ; c’est ce qui la rend gratuite. Ce site n’en affiche aucune.',
          'Là où la loi exige un consentement avant toute publicité personnalisée — dans l’Espace économique européen, au Royaume-Uni et en Suisse —, l’application présente le formulaire de consentement de Google, et aucune publicité n’est demandée avant votre réponse. Lorsque votre région impose que ce choix reste modifiable, vous pouvez le changer ensuite depuis les réglages de l’application.',
          'Pour choisir et mesurer les publicités, le SDK AdMob lit votre identifiant publicitaire et les informations techniques décrites plus haut. Google agit en responsable de traitement indépendant pour les publicités qu’il diffuse, selon sa propre politique de confidentialité (policies.google.com/privacy). Nous ne recevons pas le profil que Google constitue, et nous ne vendons ni ne partageons nous-mêmes vos données avec des annonceurs.',
        ],
        list: [
          'Réinitialisez ou supprimez votre identifiant publicitaire dans les réglages de l’appareil (Paramètres, puis Google, puis Annonces, sur la plupart des téléphones Android). Les publicités continuent de s’afficher, mais ne sont plus personnalisées.',
          'Regardez une vidéo récompensée, facultative, pour suspendre les publicités pendant un temps limité.',
          'Passez à Pro, qui retire toute publicité de l’application tant qu’il est actif.',
        ],
      },
      {
        title: 'Mesure d’audience et rapports de plantage',
        paragraphs: [
          'Firebase Analytics nous indique, de façon agrégée, quelles fonctionnalités sont utilisées et où les utilisateurs s’arrêtent, pour orienter le développement là où il compte. Firebase Crashlytics signale les plantages pour que nous puissions les corriger. Ni l’un ni l’autre ne reçoit votre nom, votre adresse e-mail ou un identifiant de compte : l’application n’en définit jamais.',
        ],
      },
      {
        title: 'L’offre Pro et les paiements',
        paragraphs: [
          'Pro est vendu par votre boutique d’applications, qui encaisse le paiement et conserve votre moyen de paiement. Nous ne voyons jamais votre numéro de carte, vos coordonnées bancaires ni votre adresse de facturation.',
          'RevenueCat enregistre qu’un achat a eu lieu et indique à l’application si Pro est actif. Il reçoit l’identifiant anonyme généré sur votre appareil, le reçu de la boutique, le produit acheté et des informations de base sur l’appareil, et les traite pour notre compte, selon sa propre politique de confidentialité (revenuecat.com/privacy).',
        ],
      },
      {
        title: 'Notifications',
        paragraphs: [
          'Si l’application propose des rappels et que vous autorisez les notifications, ceux-ci sont programmés sur votre appareil par l’application elle-même : rien n’est envoyé à un serveur pour les délivrer. L’application demande l’autorisation depuis l’écran où vous activez un rappel, jamais au lancement, et vous pouvez la retirer à tout moment dans les réglages de l’appareil.',
        ],
      },
      {
        title: 'Ce site',
        paragraphs: [
          'Ce site ne dépose aucun cookie, ne mesure pas l’audience, ne charge aucun script tiers et n’affiche aucune publicité. Comme pour tout site, l’hébergeur conserve brièvement des journaux techniques, qui peuvent contenir votre adresse IP, à des fins de sécurité et de diagnostic.',
        ],
      },
      {
        title: 'Pourquoi nous traitons ces données, et sur quelle base légale',
        paragraphs: [
          'Pour les utilisateurs de l’Espace économique européen, du Royaume-Uni et de la Suisse, la loi exige une base légale pour chaque finalité. Les nôtres sont les suivantes.',
        ],
        list: [
          'Exécution du contrat : fournir les fonctionnalités de l’application et débloquer les fonctionnalités Pro que vous avez payées.',
          'Consentement : la publicité personnalisée là où la loi l’exige, et les notifications, que le système n’autorise qu’une fois la permission accordée. Vous pouvez retirer l’un ou l’autre à tout moment, sans effet sur ce qui a eu lieu avant.',
          'Intérêt légitime : la mesure d’audience agrégée et les rapports de plantage, pour améliorer et corriger l’application, sans identifiant direct.',
          'Obligation légale : conserver les pièces que les règles comptables et fiscales imposent pour un achat.',
        ],
      },
      {
        title: 'Qui d’autre reçoit des données',
        paragraphs: [
          'Nous ne vendons pas vos données personnelles. Les prestataires ci-dessous en reçoivent parce qu’une fonctionnalité ne peut pas fonctionner sans eux, chacun selon ses propres conditions publiées.',
        ],
        list: [
          'Google (AdMob) : choix et mesure des publicités de la version gratuite.',
          'Google (Firebase Analytics et Crashlytics) : mesure d’audience et rapports de plantage.',
          'Votre boutique d’applications (Google Play ou l’App Store) : paiement, remboursements et gestion des abonnements.',
          'RevenueCat : validation des achats et gestion du droit d’accès Pro pour notre compte.',
          'Les autorités publiques : uniquement sur demande légale valable, et dans la seule mesure requise.',
        ],
      },
      {
        title: 'Où vos données sont traitées',
        paragraphs: [
          'Google et RevenueCat opèrent dans plusieurs pays, dont les États-Unis : une partie de ces données est donc traitée hors de l’Espace économique européen. Ces transferts reposent sur les garanties que ces prestataires documentent, comme les clauses contractuelles types de la Commission européenne ou le cadre de protection des données UE–États-Unis lorsque le prestataire y est certifié.',
        ],
      },
      {
        title: 'Combien de temps les données sont conservées',
        paragraphs: [
          'Nous ne conservons les données que le temps de la finalité qui les justifie.',
        ],
        list: [
          'Événements de mesure d’audience : pendant la durée de conservation réglée dans Google Analytics pour l’application, [2 ou 14 mois].',
          'Rapports de plantage : 90 jours.',
          'Traces d’achat : tant que l’abonnement ou l’achat est actif, puis le temps qu’imposent les règles comptables et fiscales.',
          'Données sur votre appareil : jusqu’à ce que vous vidiez les données de l’application ou la désinstalliez.',
          'Messages que vous nous envoyez : le temps d’y répondre, [et au plus N mois après le dernier échange].',
        ],
      },
      {
        title: 'Enfants',
        paragraphs: [
          'L’application ne s’adresse pas aux enfants, et nous ne collectons pas sciemment de données personnelles auprès d’une personne n’ayant pas l’âge du consentement valable dans son pays. Si vous pensez qu’un enfant nous a transmis des données personnelles, écrivez-nous et nous supprimerons ce que nous détenons.',
        ],
      },
      {
        title: 'Vos droits',
        paragraphs: [
          `Vous pouvez nous demander l’accès à vos données personnelles, leur rectification ou leur effacement, une copie dans un format portable, ou la limitation de leur usage ; vous pouvez vous opposer à un traitement fondé sur notre intérêt légitime, et retirer un consentement à tout moment. Écrivez à ${SITE.supportEmail} : nous répondons sous un mois. L’application ne comporte pas de compte ; nous pourrons donc vous demander des précisions qui identifient votre installation.`,
          'Effacer ce que l’application conserve sur votre téléphone est immédiat et ne dépend que de vous : videz ses données ou désinstallez-la. Pour les données traitées par Google et RevenueCat, vous pouvez aussi utiliser les outils que ces prestataires proposent, et les réglages de publicité et de confidentialité de votre appareil.',
          'Vous avez également le droit d’introduire une réclamation auprès d’une autorité de protection des données — [l’autorité du pays où l’éditeur est établi, par exemple la CNIL en France], ou celle de votre lieu de résidence.',
        ],
      },
      {
        title: 'Modifications de cette politique',
        paragraphs: [
          'Lorsque cette politique change, la date en haut de la page change avec elle. Une modification qui touche sensiblement au traitement de vos données est annoncée dans l’application avant de prendre effet, et lorsque la loi exige un nouveau consentement, nous le demandons.',
        ],
      },
    ],
  },

  terms: {
    title: 'Conditions d’utilisation',
    description: `Les conditions d’utilisation de ${SITE.name} : la licence, la version gratuite et ses publicités, la facturation, la résiliation et la restauration de Pro.`,
    intro: [
      `Ces conditions régissent votre utilisation de l’application mobile ${SITE.name} et de ce site, tous deux édités par ${SITE.publisher}. En installant ou en utilisant l’application, vous les acceptez ; si vous ne les acceptez pas, ne l’utilisez pas.`,
      'L’application est gratuite à télécharger et à utiliser. Certaines fonctionnalités relèvent d’une offre payante, Pro, décrite ci-dessous.',
    ],
    sections: [
      {
        title: 'Les parties',
        paragraphs: [
          `Ces conditions forment un accord entre vous et ${SITE.publisher} (« nous »). L’application est distribuée par des boutiques d’applications ; la boutique n’est pas partie à cet accord, mais ses propres conditions s’appliquent aussi à votre téléchargement et à vos achats.`,
        ],
      },
      {
        title: 'Le service',
        paragraphs: [
          '[Décrivez en quelques phrases ce que fait l’application, et ce qu’elle ne fait pas.]',
        ],
      },
      {
        title: 'Votre licence d’utilisation',
        paragraphs: [
          'Nous vous accordons une licence personnelle, non exclusive, non transférable et révocable d’utiliser l’application sur les appareils que vous possédez ou contrôlez, pour votre usage propre. Elle vous donne un droit d’usage, non la propriété de l’application, de son code, de son design ou de son contenu.',
        ],
      },
      {
        title: 'Ce qui est interdit',
        paragraphs: [
          'Vous vous engagez à ne pas faire ce qui suit, vous-même ou par l’intermédiaire d’un tiers.',
        ],
        list: [
          'Copier, modifier, distribuer, louer, vendre ou sous-licencier l’application, ou la redistribuer hors des boutiques qui la proposent.',
          'La décompiler, la désassembler ou en rétro-concevoir le fonctionnement, sauf là où la loi l’autorise expressément malgré cette interdiction.',
          'Contourner ou perturber les publicités de la version gratuite, ou les vérifications qui déterminent si Pro est débloqué.',
          'Perturber l’application ou les services dont elle dépend, ou l’utiliser à des fins illicites.',
        ],
      },
      {
        title: 'La version gratuite et ses publicités',
        paragraphs: [
          'La version gratuite est financée par des publicités diffusées par Google AdMob. Nous ne les rédigeons ni ne les choisissons et ne sommes pas responsables de leur contenu ; une réclamation sur une publicité précise s’adresse à Google. Vous pouvez suspendre les publicités pendant un temps limité en regardant une vidéo récompensée facultative, ou les supprimer avec Pro.',
          '[Indiquez ce que comprend la version gratuite, et les éventuelles limites qui s’y appliquent.]',
        ],
      },
      {
        title: 'Pro : formules, prix et facturation',
        paragraphs: [
          'Pro débloque les fonctionnalités qui lui sont réservées, à commencer par la suppression de toute publicité. [Listez les autres fonctionnalités Pro.]',
          'Les formules proposées, leurs prix, leurs périodes de facturation et l’éventuel essai gratuit sont ceux qu’affiche l’application au moment de l’achat, dans votre devise, et que votre boutique confirme avant le paiement. La boutique débite le moyen de paiement associé à votre compte.',
          'Un abonnement se renouvelle automatiquement à la fin de chaque période, au prix alors en vigueur, sauf résiliation avant la fin de cette période — sur l’App Store, au moins 24 heures avant. Si un prix change, votre boutique vous en informe à l’avance et, lorsque c’est requis, demande votre accord. Un achat unique débloque Pro sans paiement récurrent, tant que l’application reste disponible.',
        ],
      },
      {
        title: 'Essais gratuits',
        paragraphs: [
          'Lorsqu’une formule comprend un essai gratuit, l’application en indique la durée avant que vous ne le commenciez. Sauf résiliation avant son terme, l’essai devient un abonnement payant et votre boutique vous débite. Un essai est proposé une fois par compte de boutique, là où la boutique le permet.',
        ],
      },
      {
        title: 'Résiliation, remboursement et rétractation',
        paragraphs: [
          'Vous résiliez un abonnement depuis votre compte de boutique ; les réglages de l’application renvoient vers la bonne page. La résiliation arrête le prochain renouvellement, et Pro reste actif jusqu’à la fin de la période déjà payée. Désinstaller l’application ne résilie pas un abonnement.',
          'Les remboursements relèvent de votre boutique, selon sa propre politique. Écrivez-nous si un achat s’est mal passé : nous vous aiderons dans la mesure du possible.',
          'Si vous êtes un consommateur de l’Union européenne ou du Royaume-Uni, la loi peut vous accorder un droit de rétractation pour les contenus numériques, qui peut prendre fin dès que la fourniture commence avec votre accord. Rien dans ces conditions ne retire les droits impératifs des consommateurs de votre pays de résidence.',
        ],
      },
      {
        title: 'Restauration d’un achat et échec de renouvellement',
        paragraphs: [
          'Pro est rattaché au compte de boutique qui l’a acheté. Installer l’application sur un autre appareil connecté à ce compte le restaure, et l’application propose une action de restauration s’il n’apparaît pas de lui-même.',
          'Si le paiement d’un renouvellement échoue, votre boutique décide si l’abonnement continue de donner accès quelque temps, le temps de régulariser le moyen de paiement. L’application suit ce que la boutique indique et n’accorde aucun accès au-delà ; tant que ce délai court, elle vous indique quand l’accès prendra fin.',
        ],
      },
      {
        title: 'Disponibilité et modifications',
        paragraphs: [
          'Nous pouvons modifier, suspendre ou arrêter l’application ou l’une de ses fonctionnalités, et nous ne garantissons pas qu’elle soit toujours disponible ni exempte d’erreurs. Nous pouvons aussi modifier ces conditions : la date en haut de la page change avec elles, une modification importante est annoncée dans l’application avant de prendre effet, et continuer à utiliser l’application ensuite vaut acceptation.',
        ],
      },
      {
        title: 'Propriété intellectuelle',
        paragraphs: [
          `L’application, son nom, son code, son design et son contenu appartiennent à ${SITE.publisher} ou à ses concédants. Les composants open source restent soumis à leurs propres licences, et les marques de tiers appartiennent à leurs titulaires.`,
        ],
      },
      {
        title: 'Services tiers',
        paragraphs: [
          'L’application s’appuie sur des tiers — notamment Google pour la distribution, la publicité, la mesure d’audience et les rapports de plantage, votre boutique pour les paiements, et RevenueCat pour les achats. Nous ne sommes pas responsables de leur disponibilité ni de leurs défaillances, et leurs propres conditions s’appliquent à votre utilisation de leurs services.',
        ],
      },
      {
        title: 'Limitation de responsabilité',
        paragraphs: [
          'L’application est fournie en l’état et selon sa disponibilité. Dans toute la mesure permise par la loi, nous excluons les garanties implicites et ne sommes pas responsables des dommages indirects, de la perte de données ni du manque à gagner ; lorsque notre responsabilité ne peut être exclue, elle est limitée au montant que vous avez payé pour Pro au cours des douze mois précédant la réclamation. Rien ici ne limite une responsabilité que la loi interdit de limiter, notamment au titre des règles impératives de protection des consommateurs de votre pays.',
        ],
      },
      {
        title: 'Fin de l’utilisation',
        paragraphs: [
          'Vous pouvez cesser d’utiliser l’application à tout moment en la désinstallant ; un abonnement actif se résilie à part, depuis votre compte de boutique. Nous pouvons suspendre ou mettre fin à votre accès si vous enfreignez ces conditions.',
        ],
      },
      {
        title: 'Confidentialité',
        paragraphs: [
          'Le traitement de vos données personnelles est décrit dans notre politique de confidentialité, qui fait partie de ces conditions.',
        ],
      },
      {
        title: 'Configuration requise',
        paragraphs: [
          `L’application fonctionne sous Android 8.0 ou version ultérieure et est disponible sur Google Play (${STORE_URL}). Les frais de données mobiles liés à son utilisation restent à votre charge.`,
        ],
      },
      {
        title: 'Droit applicable',
        paragraphs: [
          'Ces conditions sont régies par [le droit du pays de l’éditeur], sans préjudice des règles impératives de protection des consommateurs du pays où vous résidez habituellement, dont vous pouvez également saisir les tribunaux.',
        ],
      },
      {
        title: 'Divisibilité et langue',
        paragraphs: [
          'Si une clause de ces conditions est jugée invalide, les autres restent en vigueur. Ces conditions sont publiées en anglais et en français ; en cas de divergence, la version [anglaise ou française] prévaut.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          `Pour toute question sur ces conditions, un achat ou l’application, écrivez à ${SITE.supportEmail} en précisant votre appareil et la version de l’application.`,
        ],
      },
    ],
  },
}
