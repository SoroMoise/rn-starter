import { DEFAULT_SETTINGS } from '@/constants/config'
import type { UserSettings } from '@/types'
import { KEYS } from '../keys'
import { mmkv } from '../mmkv'

export function readUserSettingsFromStorage(): UserSettings {
  try {
    const raw = mmkv.getString(KEYS.USER_SETTINGS)
    if (!raw) return DEFAULT_SETTINGS

    const parsed = JSON.parse(raw) as { state?: { settings?: Partial<UserSettings> } }
    const stored = parsed?.state?.settings

    if (!stored || typeof stored !== 'object') return DEFAULT_SETTINGS

    return { ...DEFAULT_SETTINGS, ...stored }
  } catch {
    return DEFAULT_SETTINGS
  }
}
