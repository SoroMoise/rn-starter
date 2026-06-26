export const SHEET_TOP_OFFSET = 80

export function computePartialY(screenHeight: number, initialSnap: number): number {
  return Math.max(0, screenHeight * (1 - initialSnap) - SHEET_TOP_OFFSET)
}

export type SnapDecision = 'snapToFull' | 'snapToPartial' | 'close' | 'bounceBack'

export function resolveSnapDecision(params: {
  currentSnapIndex: 0 | 1
  translationY: number
  velocityY: number
  partialY: number
  isIOS: boolean
}): SnapDecision {
  'worklet'
  const { currentSnapIndex, translationY, velocityY, partialY, isIOS } = params

  if (currentSnapIndex === 0) {
    if (translationY < -partialY * 0.35 || velocityY < -500) return 'snapToFull'
    if (translationY > 100 || velocityY > 500) return 'close'
    return 'bounceBack'
  }

  if (translationY > 120 || velocityY > 500) {
    return isIOS ? 'snapToPartial' : 'close'
  }
  return 'bounceBack'
}
