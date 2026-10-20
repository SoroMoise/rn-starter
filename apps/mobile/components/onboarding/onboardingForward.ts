import { createContext, useContext, useEffect } from 'react'

type RegisterForward = (action: (() => void) | null) => void

export const OnboardingForwardContext = createContext<RegisterForward | null>(null)

export function useOnboardingForward(action: (() => void) | null) {
  const register = useContext(OnboardingForwardContext)

  useEffect(() => {
    if (!register) return
    register(action)
    return () => register(null)
  }, [register, action])
}
