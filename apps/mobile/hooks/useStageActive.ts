import { useIsFocused } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

/** True only while this screen is focused AND the app is in the foreground. */
export function useStageActive(): boolean {
  const focused = useIsFocused()
  const [foreground, setForeground] = useState(() => AppState.currentState !== 'background')

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) =>
      setForeground(state !== 'background')
    )
    return () => subscription.remove()
  }, [])

  return focused && foreground
}
