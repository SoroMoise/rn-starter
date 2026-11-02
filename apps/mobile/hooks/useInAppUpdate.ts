import { IN_APP_UPDATE_ENABLED } from '@/constants/config'
import { analyticsService } from '@/services/api/analyticsService'
import { shouldOfferUpdate } from '@/services/api/appUpdatePolicy'
import { appUpdateService } from '@/services/api/appUpdateService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { appUpdateStorage } from '@/services/storage/domains/appUpdate'
import { triggerLight } from '@/utils/haptics'
import { useSegments } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

const SETTLE_MS = 2000

const isOpenToTheSheet = (): boolean =>
  AppState.currentState === 'active' && !promoCoordinator.isSurfaceVisible()

export function useInAppUpdate() {
  const isOnTabs = useSegments()[0] === '(tabs)'
  const [isForeground, setForeground] = useState(() => AppState.currentState !== 'background')
  const [isDownloaded, setDownloaded] = useState(false)
  const [isDismissed, setDismissed] = useState(false)
  const checkedThisVisit = useRef(false)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') checkedThisVisit.current = false
      setForeground(state !== 'background')
    })
    return () => subscription.remove()
  }, [])

  useEffect(
    () =>
      appUpdateService.subscribe((status) => {
        setDownloaded(status === 'downloaded')
        if (status === 'downloaded') analyticsService.track('app_update_downloaded')
      }),
    []
  )

  useEffect(() => {
    if (!IN_APP_UPDATE_ENABLED || !appUpdateService.isSupported()) return
    if (!isOnTabs || !isForeground || checkedThisVisit.current) return
    let isCurrent = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const offer = async () => {
      const info = await appUpdateService.info()
      if (!isCurrent) return
      if (info?.installStatus === 'downloaded') setDownloaded(true)
      if (
        !info ||
        !shouldOfferUpdate({ info, offeredVersionCode: appUpdateStorage.getOfferedVersionCode() })
      ) {
        checkedThisVisit.current = true
        return
      }
      const openSheet = async () => {
        if (!isOpenToTheSheet()) {
          timer = setTimeout(openSheet, SETTLE_MS)
          return
        }
        checkedThisVisit.current = true
        appUpdateStorage.setOfferedVersionCode(info.availableVersionCode)
        analyticsService.track('app_update_offered')
        const result = await appUpdateService.startFlexible()
        analyticsService.track('app_update_answered', { result })
      }
      await openSheet()
    }

    timer = setTimeout(offer, SETTLE_MS)
    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [isOnTabs, isForeground])

  const restart = useCallback(() => {
    triggerLight()
    analyticsService.track('app_update_restarted')
    void appUpdateService.complete()
  }, [])

  const dismiss = useCallback(() => {
    triggerLight()
    setDismissed(true)
  }, [])

  return {
    isReadyToRestart: isDownloaded && !isDismissed && isOnTabs,
    restart,
    dismiss,
  }
}
