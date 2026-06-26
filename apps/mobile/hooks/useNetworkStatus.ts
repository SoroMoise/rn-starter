import { analyticsService } from '@/services/api/analyticsService'
import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

// Single module-level NetInfo subscription shared across the entire app.
// All React consumers and non-React subscribers read from this singleton.

let _isOnline = true
const _subscribers = new Set<(online: boolean) => void>()

function notify(online: boolean) {
  _isOnline = online
  _subscribers.forEach((fn) => fn(online))
}

NetInfo.fetch().then((state) => {
  const connected = state.isConnected ?? true
  if (connected !== _isOnline) notify(connected)
})

NetInfo.addEventListener((state) => {
  const connected = state.isConnected ?? false
  if (connected === _isOnline) return
  if (!connected) analyticsService.track('offline_banner_shown')
  notify(connected)
})

/** Synchronous read of the current cached connectivity state. */
export function getIsOnline(): boolean {
  return _isOnline
}

/**
 * Subscribe to connectivity changes outside of React.
 * Returns an unsubscribe function.
 */
export function subscribeToNetworkStatus(fn: (online: boolean) => void): () => void {
  _subscribers.add(fn)
  return () => {
    _subscribers.delete(fn)
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(_isOnline)

  useEffect(() => {
    // Sync with current state in case it changed before mount.
    setIsOnline(_isOnline)
    return subscribeToNetworkStatus(setIsOnline)
  }, [])

  return { isOnline }
}
