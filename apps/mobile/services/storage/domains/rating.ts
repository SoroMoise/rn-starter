import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

const getNumber = (key: string): number => {
  const raw = mmkv.getString(key)
  if (!raw) return 0
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : 0
}

const getNumberOrNull = (key: string): number | null => {
  const raw = mmkv.getString(key)
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

const getBoolean = (key: string): boolean => mmkv.getString(key) === 'true'

export const ratingStorage = {
  getPromptCount: () => getNumber(KEYS.RATING_PROMPT_COUNT),
  setPromptCount: (n: number) => mmkv.set(KEYS.RATING_PROMPT_COUNT, n.toString()),

  getLastPromptExecution: () => getNumber(KEYS.RATING_LAST_PROMPT_EXECUTION),
  setLastPromptExecution: (n: number) => mmkv.set(KEYS.RATING_LAST_PROMPT_EXECUTION, n.toString()),

  getFirstUsageDate: () => getNumberOrNull(KEYS.RATING_FIRST_USAGE_DATE),
  setFirstUsageDate: (ts: number) => mmkv.set(KEYS.RATING_FIRST_USAGE_DATE, ts.toString()),

  getHasRated: () => getBoolean(KEYS.HAS_RATED_APP),
  setHasRated: (v: boolean) => mmkv.set(KEYS.HAS_RATED_APP, v.toString()),

  getDeclinedForever: () => getBoolean(KEYS.RATING_DECLINED_FOREVER),
  setDeclinedForever: (v: boolean) => mmkv.set(KEYS.RATING_DECLINED_FOREVER, v.toString()),

  getLastPromptDate: () => getNumber(KEYS.RATING_LAST_PROMPT_DATE),
  setLastPromptDate: (ts: number) => mmkv.set(KEYS.RATING_LAST_PROMPT_DATE, ts.toString()),
}
