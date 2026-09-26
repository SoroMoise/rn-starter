import { mmkvStateStorage } from '@/services/storage/adapter'
import { KEYS } from '@/services/storage/keys'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface OnboardingStore {
  isCompleted: boolean
  attemptedSkipTrial: boolean
  hasSeenProWelcome: boolean

  markAttemptedSkipTrial: () => void
  markCompleted: () => void
  markProWelcomeSeen: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isCompleted: false,
      attemptedSkipTrial: false,
      hasSeenProWelcome: false,

      markAttemptedSkipTrial: () => set({ attemptedSkipTrial: true }),
      markCompleted: () => set({ isCompleted: true }),
      markProWelcomeSeen: () => set({ hasSeenProWelcome: true }),
    }),
    {
      name: KEYS.ONBOARDING_SEEN,
      storage: createJSONStorage(() => mmkvStateStorage),
      // The current step is not persisted — each step writes its answer into the store it owns.
      partialize: (state) => ({
        isCompleted: state.isCompleted,
        attemptedSkipTrial: state.attemptedSkipTrial,
        hasSeenProWelcome: state.hasSeenProWelcome,
      }),
    }
  )
)
