import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

const getNumber = (key: string): number => {
  const raw = mmkv.getString(key)
  if (!raw) return 0
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : 0
}

const getBoolean = (key: string): boolean => mmkv.getString(key) === 'true'

export const reviewStorage = {
  isOptedOut: (): boolean =>
    getBoolean(KEYS.HAS_RATED_APP) || getBoolean(KEYS.RATING_DECLINED_FOREVER),

  getRequestCount: (): number => getNumber(KEYS.REVIEW_REQUEST_COUNT),
  getLastRequestAt: (): number => getNumber(KEYS.REVIEW_LAST_REQUEST_AT),

  recordRequest({ index, at }: { index: number; at: number }): void {
    mmkv.set(KEYS.REVIEW_REQUEST_COUNT, index.toString())
    mmkv.set(KEYS.REVIEW_LAST_REQUEST_AT, at.toString())
  },

  getArmed: (): boolean => getBoolean(KEYS.REVIEW_REQUEST_ARMED),
  setArmed: (armed: boolean) => mmkv.set(KEYS.REVIEW_REQUEST_ARMED, armed.toString()),
}
