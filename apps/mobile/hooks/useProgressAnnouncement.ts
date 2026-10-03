import { useEffect, useRef } from 'react'
import { AccessibilityInfo } from 'react-native'

const MILESTONE = 0.25

export function useProgressAnnouncement({
  progress,
  describe,
}: {
  progress: number | null
  describe: (milestone: number) => string
}) {
  const lastRef = useRef(0)
  const describeRef = useRef(describe)
  describeRef.current = describe

  useEffect(() => {
    if (progress === null) return
    const milestone = Math.floor(progress / MILESTONE) * MILESTONE
    if (milestone < lastRef.current) lastRef.current = milestone
    if (milestone <= lastRef.current || milestone >= 1) return
    lastRef.current = milestone
    AccessibilityInfo.announceForAccessibility(describeRef.current(milestone))
  }, [progress])
}
