import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

let _isOnline = true
const _subscribers = new Set<(online: boolean) => void>()

function notify(online: boolean) {
  _isOnline = online
  _subscribers.forEach((fn) => fn(online))
}

const isConnected = (state: NetInfoState) => state.isConnected !== false

NetInfo.fetch().then((state) => {
  const connected = isConnected(state)
  if (connected !== _isOnline) notify(connected)
})

NetInfo.addEventListener((state) => {
  const connected = isConnected(state)
  if (connected === _isOnline) return
  notify(connected)
})

export function getIsOnline(): boolean {
  return _isOnline
}

export function subscribeToNetworkStatus(fn: (online: boolean) => void): () => void {
  _subscribers.add(fn)
  return () => {
    _subscribers.delete(fn)
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(_isOnline)

  useEffect(() => {
    setIsOnline(_isOnline)
    return subscribeToNetworkStatus(setIsOnline)
  }, [])

  return { isOnline }
}
