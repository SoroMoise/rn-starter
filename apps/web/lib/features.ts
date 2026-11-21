import type { IconName } from './icons'

export type FeatureGroup = 'essentials' | 'pro'
export type FeatureStatus = 'available' | 'soon'
export type FeatureTier = 'free' | 'pro'

type Feature = {
  group: FeatureGroup
  icon: IconName
  status: FeatureStatus
  tier: FeatureTier
}

const FEATURE_TABLE = {
  featureOne: { group: 'essentials', icon: 'sparkle', status: 'available', tier: 'free' },
  featureTwo: { group: 'essentials', icon: 'bolt', status: 'available', tier: 'free' },
  featureThree: { group: 'essentials', icon: 'sliders', status: 'available', tier: 'free' },
  noAccount: { group: 'essentials', icon: 'userOff', status: 'available', tier: 'free' },
  noAds: { group: 'pro', icon: 'ban', status: 'available', tier: 'pro' },
  proFeature: { group: 'pro', icon: 'diamond', status: 'soon', tier: 'pro' },
} as const satisfies Record<string, Feature>

export type FeatureId = keyof typeof FEATURE_TABLE

export const FEATURES: Record<FeatureId, Feature> = FEATURE_TABLE

export const FEATURE_IDS = Object.keys(FEATURES) as FeatureId[]

export const FEATURE_GROUPS: readonly FeatureGroup[] = ['essentials', 'pro']

export function isAvailable(id: FeatureId): boolean {
  return FEATURES[id].status === 'available'
}

export function isPro(id: FeatureId): boolean {
  return FEATURES[id].tier === 'pro'
}

export function featuresIn(group: FeatureGroup): FeatureId[] {
  return FEATURE_IDS.filter((id) => FEATURES[id].group === group && isAvailable(id))
}

export const SOON_FEATURES: FeatureId[] = FEATURE_IDS.filter((id) => !isAvailable(id))

export const IOS_STATUS: FeatureStatus = 'soon'
