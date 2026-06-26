import type { Persona } from '@/stores/onboardingStore'
import { PREMIUM_FEATURES } from '@/constants/purchases'

export const ALL_PERSONAS: readonly Persona[] = ['traveler', 'trader', 'freelancer', 'general']

export type HeroVisualKind =
  | 'widget-mockup'
  | 'alert-mockup'
  | 'document-mockup'
  | 'clean-app-mockup'

type PremiumFeatureKey = (typeof PREMIUM_FEATURES)[number]['key']

export type SecondaryFeatureKey = PremiumFeatureKey | 'offline' | 'statistics'

export interface PersonaQuestion {
  labelKey: string
  descKey: string
  emoji: string
}

export interface PersonaAha {
  defaultTargets: readonly string[]
}

export interface PersonaPitch {
  headlineKey: string
  heroFeatureKey: SecondaryFeatureKey
  heroVisualKind: HeroVisualKind
  heroCaptionKey: string
  secondary: readonly [SecondaryFeatureKey, SecondaryFeatureKey]
}

export interface PersonaContent {
  question: PersonaQuestion
  aha: PersonaAha
  pitch: PersonaPitch
}

export const PERSONA_CONTENT = {
  traveler: {
    question: {
      labelKey: 'onboarding.persona.traveler.label',
      descKey: 'onboarding.persona.traveler.desc',
      emoji: '✈️',
    },
    aha: {
      defaultTargets: ['EUR', 'JPY', 'GBP'] as const,
    },
    pitch: {
      headlineKey: 'onboarding.pitch.traveler.headline',
      heroFeatureKey: 'homeWidget',
      heroVisualKind: 'widget-mockup',
      heroCaptionKey: 'onboarding.pitch.traveler.heroCaption',
      secondary: ['noAds', 'offline'] as const,
    },
  },
  trader: {
    question: {
      labelKey: 'onboarding.persona.trader.label',
      descKey: 'onboarding.persona.trader.desc',
      emoji: '📈',
    },
    aha: {
      defaultTargets: ['EUR', 'JPY', 'GBP'] as const,
    },
    pitch: {
      headlineKey: 'onboarding.pitch.trader.headline',
      heroFeatureKey: 'rateAlerts',
      heroVisualKind: 'alert-mockup',
      heroCaptionKey: 'onboarding.pitch.trader.heroCaption',
      secondary: ['statistics', 'noAds'] as const,
    },
  },
  freelancer: {
    question: {
      labelKey: 'onboarding.persona.freelancer.label',
      descKey: 'onboarding.persona.freelancer.desc',
      emoji: '💼',
    },
    aha: {
      defaultTargets: ['EUR', 'USD', 'GBP'] as const,
    },
    pitch: {
      headlineKey: 'onboarding.pitch.freelancer.headline',
      heroFeatureKey: 'export',
      heroVisualKind: 'document-mockup',
      heroCaptionKey: 'onboarding.pitch.freelancer.heroCaption',
      secondary: ['backup', 'noAds'] as const,
    },
  },
  general: {
    question: {
      labelKey: 'onboarding.persona.general.label',
      descKey: 'onboarding.persona.general.desc',
      emoji: '🌐',
    },
    aha: {
      defaultTargets: ['EUR', 'JPY', 'GBP'] as const,
    },
    pitch: {
      headlineKey: 'onboarding.pitch.general.headline',
      heroFeatureKey: 'noAds',
      heroVisualKind: 'clean-app-mockup',
      heroCaptionKey: 'onboarding.pitch.general.heroCaption',
      secondary: ['homeWidget', 'offline'] as const,
    },
  },
} as const satisfies Record<Persona, PersonaContent>
