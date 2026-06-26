import { mmkvStateStorage } from '@/services/storage/adapter'
import { KEYS } from '@/services/storage/keys'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Persona = 'traveler' | 'trader' | 'freelancer' | 'general'

interface OnboardingStore {
  isCompleted: boolean
  currentSlide: number
  hasSeenPullToRefreshTutorial: boolean
  persona: Persona | null
  attemptedSkipTrial: boolean
  hasSeenProWelcome: boolean

  setCurrentSlide: (slide: number) => void
  setPersona: (persona: Persona) => void
  markAttemptedSkipTrial: () => void
  markCompleted: () => void
  markPullToRefreshTutorialSeen: () => void
  markProWelcomeSeen: () => void
  resetOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isCompleted: false,
      currentSlide: 0,
      hasSeenPullToRefreshTutorial: false,
      persona: null,
      attemptedSkipTrial: false,
      hasSeenProWelcome: false,

      setCurrentSlide: (slide: number) => set({ currentSlide: slide }),
      setPersona: (persona: Persona) => set({ persona }),
      markAttemptedSkipTrial: () => set({ attemptedSkipTrial: true }),
      markCompleted: () => set({ isCompleted: true }),
      markPullToRefreshTutorialSeen: () => set({ hasSeenPullToRefreshTutorial: true }),
      markProWelcomeSeen: () => set({ hasSeenProWelcome: true }),
      resetOnboarding: () =>
        set({
          isCompleted: false,
          currentSlide: 0,
          hasSeenPullToRefreshTutorial: false,
          persona: null,
          attemptedSkipTrial: false,
          hasSeenProWelcome: false,
        }),
    }),
    {
      name: KEYS.ONBOARDING_SEEN,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        isCompleted: state.isCompleted,
        hasSeenPullToRefreshTutorial: state.hasSeenPullToRefreshTutorial,
        persona: state.persona,
        attemptedSkipTrial: state.attemptedSkipTrial,
        hasSeenProWelcome: state.hasSeenProWelcome,
      }),
    }
  )
)
