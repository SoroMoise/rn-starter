import type { RouteKey } from './routes'

export const HUB_CHILDREN = {
  useCases: ['useCaseExample'],
  guides: ['guideExample'],
} as const satisfies Record<string, readonly RouteKey[]>

export type HubKey = keyof typeof HUB_CHILDREN
export type TopicKey = (typeof HUB_CHILDREN.useCases)[number]
export type GuideKey = (typeof HUB_CHILDREN.guides)[number]
export type CoreKey = 'home' | 'features' | 'pricing' | 'faq' | 'about'
export type LegalKey = 'privacy' | 'terms'

export const CORE_KEYS: readonly CoreKey[] = ['home', 'features', 'pricing', 'faq', 'about']
export const HUB_KEYS = Object.keys(HUB_CHILDREN) as HubKey[]
export const TOPIC_KEYS: readonly TopicKey[] = HUB_CHILDREN.useCases
export const GUIDE_KEYS: readonly GuideKey[] = HUB_CHILDREN.guides

export function isHub(key: RouteKey): key is HubKey {
  return key in HUB_CHILDREN
}

export function isTopic(key: RouteKey): key is TopicKey {
  return (TOPIC_KEYS as readonly RouteKey[]).includes(key)
}

export function isGuide(key: RouteKey): key is GuideKey {
  return (GUIDE_KEYS as readonly RouteKey[]).includes(key)
}

export function isLegal(key: RouteKey): key is LegalKey {
  return key === 'privacy' || key === 'terms'
}

export function parentOf(key: RouteKey): HubKey | undefined {
  return HUB_KEYS.find((hub) => (HUB_CHILDREN[hub] as readonly RouteKey[]).includes(key))
}

export function breadcrumbTrail(key: RouteKey): RouteKey[] {
  if (key === 'home') return ['home']
  const parent = parentOf(key)
  return parent ? ['home', parent, key] : ['home', key]
}
