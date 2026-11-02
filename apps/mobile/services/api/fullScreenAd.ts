import { reportAdFailure } from '@/services/api/adFailures'
import { AdEventType } from 'react-native-google-mobile-ads'

const PRESENTATION_TIMEOUT_MS = 10_000

type FullScreenAd = {
  addAdEventListener: (type: AdEventType, listener: () => void) => () => void
  show: () => Promise<void>
}

export type PresentationEnding = 'closed' | 'failed'
export type PresentationOutcome = PresentationEnding | 'never_opened'

export function presentFullScreenAd({
  ad,
  source,
  onEnd,
}: {
  ad: FullScreenAd
  source: string
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

    const presentationTimeout = setTimeout(() => {
      reportAdFailure({
        error: new Error(`never_opened: no OPENED event within ${PRESENTATION_TIMEOUT_MS} ms`),
        source,
      })
      resolve('never_opened')
    }, PRESENTATION_TIMEOUT_MS)
    const removeOpenedListener = ad.addAdEventListener(AdEventType.OPENED, () =>
      clearTimeout(presentationTimeout)
    )
    const removeClosedListener = ad.addAdEventListener(AdEventType.CLOSED, () => end('closed'))
    const removeErrorListener = ad.addAdEventListener(AdEventType.ERROR, () => end('failed'))

    const failToShow = (error: unknown) => {
      reportAdFailure({ error, source })
      end('failed')
    }

    try {
      ad.show().catch(failToShow)
    } catch (error) {
      failToShow(error)
    }
  })
}
