import { KEYS } from '../keys'
import { mmkv } from '../mmkv'

type AdFreeListener = () => void
const listeners = new Set<AdFreeListener>()

export const adFreeStorage = {
  getUntil(): number | null {
    const raw = mmkv.getString(KEYS.AD_FREE_UNTIL)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  },
  setUntil(timestamp: number | null): void {
    if (timestamp === null) {
      mmkv.delete(KEYS.AD_FREE_UNTIL)
    } else {
      mmkv.set(KEYS.AD_FREE_UNTIL, timestamp.toString())
    }
    listeners.forEach((fn) => fn())
  },
  // Lets AdFreeProvider follow writes done outside React (backup restore).
  subscribe(fn: AdFreeListener): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}
