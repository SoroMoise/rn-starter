import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

export function useScreenReaderEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    let isMounted = true
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (isMounted) setIsEnabled(enabled)
    })
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setIsEnabled)
    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [])

  return isEnabled
}
