import type { InstallStatus, UpdateInfo } from 'in-app-updates'

const UNDER_WAY: ReadonlySet<InstallStatus> = new Set([
  'pending',
  'downloading',
  'downloaded',
  'installing',
])

export const shouldOfferUpdate = ({
  info,
  offeredVersionCode,
}: {
  info: UpdateInfo
  offeredVersionCode: number | null
}): boolean =>
  info.availability === 'available' &&
  info.flexibleAllowed &&
  !UNDER_WAY.has(info.installStatus) &&
  info.availableVersionCode !== offeredVersionCode
