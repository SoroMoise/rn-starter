import AsyncStorage from '@react-native-async-storage/async-storage'
import { KEYS } from './keys'
import { mmkv } from './mmkv'

/**
 * One-shot migration from AsyncStorage to MMKV. Idempotent.
 *
 * Two categories of keys:
 *  1. RAW_COPY_KEYS — scalars (timestamps, counters, flags). Byte-copy unchanged.
 *  2. Zustand-persisted stores — old code wrote raw values directly; the new stores use
 *     Zustand's persist envelope `{state, version}`. Format transformation is required,
 *     otherwise Zustand discards the value as malformed and falls back to defaults.
 *
 * Defensive: never overwrite MMKV keys that already exist. Protects users who installed an
 * intermediate build that wrote to MMKV directly without setting MIGRATION_DONE.
 *
 * NOTE: This file is the *only* remaining consumer of @react-native-async-storage/async-storage.
 * Once telemetry confirms MIGRATION_DONE === true is dominant in production, this file and
 * the AsyncStorage dependency can be removed.
 */

const RAW_COPY_KEYS: readonly string[] = [
  KEYS.AD_FREE_UNTIL,
  KEYS.FIRST_APP_USAGE,
  KEYS.INSTALL_DATE,
  KEYS.AD_EXECUTION_COUNT,
  KEYS.AD_LAST_SHOWN,
  KEYS.RATING_PROMPT_COUNT,
  KEYS.RATING_LAST_PROMPT_EXECUTION,
  KEYS.RATING_FIRST_USAGE_DATE,
  KEYS.HAS_RATED_APP,
  KEYS.RATING_DECLINED_FOREVER,
  KEYS.RATING_LAST_PROMPT_DATE,
  KEYS.SESSION_COUNT,
  KEYS.PAYWALL_SHOWN_COUNT,
]

const ZUSTAND_PERSIST_VERSION = 0

function tryParseJSON(value: string | null): unknown {
  if (value === null) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAlreadyZustandEnvelope(value: unknown): boolean {
  return isPlainObject(value) && 'state' in value
}

export async function runStorageMigration(): Promise<void> {
  if (mmkv.getBoolean(KEYS.MIGRATION_DONE) === true) return

  const consumedAsyncStorageKeys: string[] = []

  for (const key of RAW_COPY_KEYS) {
    if (mmkv.contains(key)) continue
    const value = await AsyncStorage.getItem(key).catch(() => null)
    if (value === null) continue
    mmkv.set(key, value)
    consumedAsyncStorageKeys.push(key)
  }

  const onboardingConsumed = await migrateOnboardingStore()
  const settingsConsumed = await migrateSettingsStore()

  consumedAsyncStorageKeys.push(...onboardingConsumed, ...settingsConsumed)

  if (consumedAsyncStorageKeys.length > 0) {
    try {
      await AsyncStorage.multiRemove(consumedAsyncStorageKeys)
    } catch {
      // Orphan AsyncStorage data is harmless; proceed.
    }
  }

  mmkv.set(KEYS.MIGRATION_DONE, true)
}

async function migrateOnboardingStore(): Promise<string[]> {
  if (mmkv.contains(KEYS.ONBOARDING_SEEN)) return []

  const [onboardingRaw, tutorialRaw] = await Promise.all([
    AsyncStorage.getItem(KEYS.ONBOARDING_SEEN).catch(() => null),
    AsyncStorage.getItem(KEYS.PULL_TO_REFRESH_TUTORIAL_SEEN).catch(() => null),
  ])

  if (onboardingRaw === null && tutorialRaw === null) return []

  const parsedOnboarding = tryParseJSON(onboardingRaw)
  if (isAlreadyZustandEnvelope(parsedOnboarding)) {
    mmkv.set(KEYS.ONBOARDING_SEEN, onboardingRaw as string)
    const consumed: string[] = [KEYS.ONBOARDING_SEEN]
    if (tutorialRaw !== null) consumed.push(KEYS.PULL_TO_REFRESH_TUTORIAL_SEEN)
    return consumed
  }

  const envelope = {
    state: {
      isCompleted: onboardingRaw === 'true',
      hasSeenPullToRefreshTutorial: tutorialRaw === 'true',
    },
    version: ZUSTAND_PERSIST_VERSION,
  }
  mmkv.set(KEYS.ONBOARDING_SEEN, JSON.stringify(envelope))

  const consumed: string[] = []
  if (onboardingRaw !== null) consumed.push(KEYS.ONBOARDING_SEEN)
  if (tutorialRaw !== null) consumed.push(KEYS.PULL_TO_REFRESH_TUTORIAL_SEEN)
  return consumed
}

async function migrateSettingsStore(): Promise<string[]> {
  if (mmkv.contains(KEYS.USER_SETTINGS)) return []

  const raw = await AsyncStorage.getItem(KEYS.USER_SETTINGS).catch(() => null)
  if (raw === null) return []

  const parsed = tryParseJSON(raw)
  if (parsed === null) return [KEYS.USER_SETTINGS]

  if (isAlreadyZustandEnvelope(parsed)) {
    mmkv.set(KEYS.USER_SETTINGS, raw)
    return [KEYS.USER_SETTINGS]
  }

  if (!isPlainObject(parsed)) return [KEYS.USER_SETTINGS]

  const envelope = {
    state: { settings: parsed },
    version: ZUSTAND_PERSIST_VERSION,
  }
  mmkv.set(KEYS.USER_SETTINGS, JSON.stringify(envelope))
  return [KEYS.USER_SETTINGS]
}
