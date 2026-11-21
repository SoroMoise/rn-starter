import { isAvailable, type FeatureId } from './features'

export function isVisible(item: { feature?: FeatureId }): boolean {
  return !item.feature || isAvailable(item.feature)
}
