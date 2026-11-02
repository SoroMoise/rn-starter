import { isTestLab } from 'app-environment'

export const adsAllowedInEnvironment = (): boolean => !isTestLab
