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
  const isOnTabsRef = useRef(isOnTabs)
  isOnTabsRef.current = isOnTabs

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
        if (status === 'downloaded') {
          setDownloaded(true)
          analyticsService.track('app_update_downloaded')
        } else if (status === 'failed' || status === 'canceled' || status === 'installed') {
          setDownloaded(false)
        }
      }),
    []
  )

  useEffect(() => {
    if (!IN_APP_UPDATE_ENABLED || !appUpdateService.isSupported()) return
    if (!isOnTabs || !isForeground || checkedThisVisit.current) return
    let isCurrent = true
    let timer: ReturnType<typeof setTimeout>

    const check = async () => {
      const info = await appUpdateService.info()
      if (!info) return
      if (info.installStatus === 'downloaded') {
        setDownloaded(true)
        return
      }
      if (
        !shouldOfferUpdate({ info, offeredVersionCode: appUpdateStorage.getOfferedVersionCode() })
      )
        return
      if (!isCurrent || !isOnTabsRef.current || !isOpenToTheSheet()) {
        checkedThisVisit.current = false
        return
      }
      appUpdateStorage.setOfferedVersionCode(info.availableVersionCode)
      analyticsService.track('app_update_offered')
      const result = await appUpdateService.startFlexible()
      analyticsService.track('app_update_answered', { result })
    }

    const attempt = () => {
      if (!isOpenToTheSheet()) {
        timer = setTimeout(attempt, SETTLE_MS)
        return
      }
      checkedThisVisit.current = true
      void check()
    }

    timer = setTimeout(attempt, SETTLE_MS)
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
