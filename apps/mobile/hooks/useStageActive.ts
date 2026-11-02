import { useIsFocused } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

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
