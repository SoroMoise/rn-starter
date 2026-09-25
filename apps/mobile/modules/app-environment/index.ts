import { requireOptionalNativeModule } from 'expo-modules-core'

type AppEnvironmentModule = {
  isTestLab: boolean
}

const native = requireOptionalNativeModule<AppEnvironmentModule>('AppEnvironment')

// False where the module is absent (iOS, Expo Go, web) — the safe answer there is
// "not a Test Lab run", since those environments do not host the crawler.
export const isTestLab: boolean = native?.isTestLab === true
