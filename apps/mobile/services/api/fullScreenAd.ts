import { AdEventType } from 'react-native-google-mobile-ads'

// Android never reports a presentation that failed: this version of the library leaves
// onAdFailedToShowFullScreenContent unhandled, so neither CLOSED nor ERROR follows it. An ad
// that has not opened by then never will.
const PRESENTATION_TIMEOUT_MS = 10_000

type FullScreenAd = {
  addAdEventListener: (type: AdEventType, listener: () => void) => () => void
  show: () => Promise<void>
}

export type PresentationOutcome = 'closed' | 'failed' | 'never_opened'

// Settles once the ad is gone. The native show() resolves the moment the ad is handed to the
// activity, so awaiting it says nothing about when the screen is free again.
export function presentFullScreenAd(ad: FullScreenAd): Promise<PresentationOutcome> {
  return new Promise((resolve) => {
    let settled = false

    const settle = (outcome: PresentationOutcome) => {
      if (settled) return
      settled = true
      clearTimeout(presentationTimeout)
      removeOpenedListener()
      removeClosedListener()
      removeErrorListener()
      resolve(outcome)
    }

    const presentationTimeout = setTimeout(() => settle('never_opened'), PRESENTATION_TIMEOUT_MS)
    const removeOpenedListener = ad.addAdEventListener(AdEventType.OPENED, () =>
      clearTimeout(presentationTimeout)
    )
    const removeClosedListener = ad.addAdEventListener(AdEventType.CLOSED, () => settle('closed'))
    const removeErrorListener = ad.addAdEventListener(AdEventType.ERROR, () => settle('failed'))

    try {
      ad.show().catch((error: unknown) => {
        console.warn('[fullScreenAd] Failed to show:', error)
        settle('failed')
      })
    } catch (error) {
      console.warn('[fullScreenAd] Failed to show:', error)
      settle('failed')
    }
  })
}
