import { resetToHome } from '@utils/navigation'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'

export function ExitToHome() {
  useFocusEffect(useCallback(() => resetToHome(), []))
  return null
}
