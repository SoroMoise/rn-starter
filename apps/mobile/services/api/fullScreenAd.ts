import { AdEventType } from 'react-native-google-mobile-ads'

// Android never reports a presentation that failed: this version of the library leaves
// onAdFailedToShowFullScreenContent unhandled, so neither CLOSED nor ERROR follows it. An ad
// that has not opened by then is given up on.
const PRESENTATION_TIMEOUT_MS = 10_000

type FullScreenAd = {
  addAdEventListener: (type: AdEventType, listener: () => void) => () => void
  show: () => Promise<void>
}

export type PresentationEnding = 'closed' | 'failed'
export type PresentationOutcome = PresentationEnding | 'never_opened'

// Resolves once the ad is gone — the native show() resolves the moment the ad is handed to the
// activity, so it says nothing about when the screen is free again — or as `never_opened` past
// the deadline. An ad given up on can still open late: `onEnd` runs whenever its presentation
// really ends, so what a shown ad owes (a reward, a spent slot) is paid late rather than never.
export function presentFullScreenAd({
  ad,
  onEnd,
}: {
  ad: FullScreenAd
  onEnd?: (ending: PresentationEnding) => void
}): Promise<PresentationOutcome> {
  return new Promise((resolve) => {
    let ended = false

    const end = (ending: PresentationEnding) => {
      if (ended) return
      ended = true
      clearTimeout(presentationTimeout)
      removeOpenedListener()
      removeClosedListener()
      removeErrorListener()
      onEnd?.(ending)
      resolve(ending)
    }

    const presentationTimeout = setTimeout(() => resolve('never_opened'), PRESENTATION_TIMEOUT_MS)
    const removeOpenedListener = ad.addAdEventListener(AdEventType.OPENED, () =>
      clearTimeout(presentationTimeout)
    )
    const removeClosedListener = ad.addAdEventListener(AdEventType.CLOSED, () => end('closed'))
    const removeErrorListener = ad.addAdEventListener(AdEventType.ERROR, () => end('failed'))

    try {
      ad.show().catch((error: unknown) => {
        console.warn('[fullScreenAd] Failed to show:', error)
        end('failed')
      })
    } catch (error) {
      console.warn('[fullScreenAd] Failed to show:', error)
      end('failed')
    }
  })
}
