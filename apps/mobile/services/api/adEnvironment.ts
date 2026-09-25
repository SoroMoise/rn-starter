import { isTestLab } from 'app-environment'

// Play's pre-launch report crawler taps ad views on every upload, and none of its
// devices can be registered as a test device — the only place to stop it is before
// the request leaves.
export const adsAllowedInEnvironment = (): boolean => !isTestLab
