import { AlertNotificationCard } from '@/components/alerts/AlertNotificationCard'
import type { AlertNotificationData } from '@/services/notifications'
import { useDeepLinkStore } from '@/stores/deepLinkStore'
import { useRouter, usePathname } from 'expo-router'
import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

export type AlertNotification = AlertNotificationData

interface AlertNotificationContextValue {
  showAlertNotification: (notification: AlertNotification) => void
  hideAlertNotification: () => void
  tapAlertDeepLink: (notification: AlertNotification) => void
}

const AlertNotificationContext = createContext<AlertNotificationContextValue | null>(null)

export function AlertNotificationProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<AlertNotification | null>(null)
  const setPendingAlert = useDeepLinkStore((s) => s.setPendingAlert)
  const router = useRouter()
  const pathname = usePathname()

  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const showAlertNotification = useCallback((notification: AlertNotification) => {
    setCurrent(notification)
  }, [])

  const hideAlertNotification = useCallback(() => {
    setCurrent(null)
  }, [])

  const tapAlertDeepLink = useCallback(
    (notification: AlertNotification) => {
      setPendingAlert({ alertId: notification.alertId })
      if (pathnameRef.current !== '/') {
        router.navigate('/')
      }
    },
    [router, setPendingAlert]
  )

  const handleCardPress = useCallback(() => {
    if (!current) return
    const snapshot = current
    setCurrent(null)
    tapAlertDeepLink(snapshot)
  }, [current, tapAlertDeepLink])

  return (
    <AlertNotificationContext.Provider
      value={{ showAlertNotification, hideAlertNotification, tapAlertDeepLink }}>
      {children}
      {current && (
        <AlertNotificationCard
          key={current.alertId}
          notification={current}
          onDismiss={hideAlertNotification}
          onPress={handleCardPress}
        />
      )}
    </AlertNotificationContext.Provider>
  )
}

export function useAlertNotification() {
  const ctx = useContext(AlertNotificationContext)
  if (!ctx) {
    throw new Error('useAlertNotification must be used within an AlertNotificationProvider')
  }
  return ctx
}
