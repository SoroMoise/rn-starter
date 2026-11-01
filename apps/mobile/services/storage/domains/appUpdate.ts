import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

export const appUpdateStorage = {
  getOfferedVersionCode(): number | null {
    const raw = mmkv.getString(KEYS.APP_UPDATE_OFFERED_VERSION)
    if (!raw) return null
    const versionCode = parseInt(raw, 10)
    return Number.isFinite(versionCode) ? versionCode : null
  },

  setOfferedVersionCode(versionCode: number): void {
    mmkv.set(KEYS.APP_UPDATE_OFFERED_VERSION, versionCode.toString())
  },
}
