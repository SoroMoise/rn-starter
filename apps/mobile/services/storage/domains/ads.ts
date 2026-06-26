import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

export const adsStorage = {
  getAdLastShown(): number {
    const raw = mmkv.getString(KEYS.AD_LAST_SHOWN)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  setAdLastShown(ts: number): void {
    mmkv.set(KEYS.AD_LAST_SHOWN, ts.toString())
  },

  getAdExecutionCount(): number {
    const raw = mmkv.getString(KEYS.AD_EXECUTION_COUNT)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  setAdExecutionCount(n: number): void {
    mmkv.set(KEYS.AD_EXECUTION_COUNT, n.toString())
  },
}
