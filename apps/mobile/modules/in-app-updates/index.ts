import { requireOptionalNativeModule, type EventSubscription } from 'expo-modules-core'

export type UpdateAvailability = 'available' | 'none' | 'in_progress' | 'unknown'

export type InstallStatus =
  | 'pending'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'installed'
  | 'failed'
  | 'canceled'
  | 'unknown'

export type UpdateInfo = {
  availability: UpdateAvailability
  flexibleAllowed: boolean
  availableVersionCode: number
  installStatus: InstallStatus
}

export type FlexibleUpdateResult = 'accepted' | 'declined' | 'failed' | 'unavailable'

type InAppUpdatesModule = {
  getUpdateInfoAsync(): Promise<UpdateInfo>
  startFlexibleUpdateAsync(): Promise<FlexibleUpdateResult>
  completeUpdateAsync(): Promise<void>
  addListener(
    eventName: 'onInstallStateChange',
    listener: (event: { installStatus: InstallStatus }) => void
  ): EventSubscription
}

export const inAppUpdatesModule = requireOptionalNativeModule<InAppUpdatesModule>('InAppUpdates')
