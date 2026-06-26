import { useOnboardingStore } from '@/stores/onboardingStore'
import { useEffect, useState } from 'react'

export function useConverterUIState() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [showSourcePicker, setShowSourcePicker] = useState(false)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const hasSeenPullToRefreshTutorial = useOnboardingStore((s) => s.hasSeenPullToRefreshTutorial)
  const markPullToRefreshTutorialSeen = useOnboardingStore((s) => s.markPullToRefreshTutorialSeen)

  useEffect(() => {
    if (!hasSeenPullToRefreshTutorial) {
      const timer = setTimeout(() => setShowTutorial(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [hasSeenPullToRefreshTutorial])

  return {
    showTutorial,
    setShowTutorial,
    showSourcePicker,
    setShowSourcePicker,
    showAddPicker,
    setShowAddPicker,
    showCalculator,
    setShowCalculator,
    isDragging,
    setIsDragging,
    markPullToRefreshTutorialSeen,
  }
}
