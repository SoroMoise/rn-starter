import type { ApiError, ExchangeRate } from '@/types'
import { CACHE_CONFIG } from '@constants/config'
import { backendService } from '@services/api/backendService'
import { crashlyticsService } from '@services/api/crashlyticsService'
import { ratesStorage } from '@/services/storage/domains/rates'
import { create } from 'zustand'

interface CurrencyStore {
  rates: ExchangeRate | null
  isLoading: boolean // true only when no cached data exists at all
  isRefreshing: boolean // true during silent background refresh (data already visible)
  isInitializing: boolean
  error: ApiError | null
  initializationError: Error | null
  lastUpdate: Date | null

  fetchRates: (baseCurrency?: string) => Promise<void>
  refreshRates: (baseCurrency?: string) => Promise<void>
  setRates: (rates: ExchangeRate) => void
  clearError: () => void
  loadCachedRates: () => Promise<void>
  initializeOfflineData: () => Promise<void>
  retryInitialization: () => Promise<void>
  clearInitializationError: () => void
  isDataStale: () => boolean
}

const saveToCacheStorage = (rates: ExchangeRate): void => {
  try {
    ratesStorage.set(rates)
  } catch (error) {
    console.warn('[CurrencyStore] Failed to save rates to cache:', error)
  }
}

const loadFromCacheStorage = (): ExchangeRate | null => {
  try {
    return ratesStorage.get()
  } catch (error) {
    console.warn('[CurrencyStore] Failed to load rates from cache:', error)
    return null
  }
}

const isWithinDebounce = (lastUpdate: Date | null): boolean => {
  if (!lastUpdate) return false
  return Date.now() - lastUpdate.getTime() < CACHE_CONFIG.RATES_DEBOUNCE_DURATION
}

const isWithinBackgroundRefresh = (lastUpdate: Date | null): boolean => {
  if (!lastUpdate) return false
  return Date.now() - lastUpdate.getTime() < CACHE_CONFIG.RATES_BACKGROUND_REFRESH
}

const fetchAndCacheRates = async (
  baseCurrency: string,
  set: (state: Partial<CurrencyStore>) => void
): Promise<void> => {
  const rates = await backendService.fetchRates(baseCurrency)
  saveToCacheStorage(rates)
  set({
    rates,
    lastUpdate: new Date(),
    isLoading: false,
    isRefreshing: false,
    isInitializing: false,
    error: null,
    initializationError: null,
  })
}

let inFlightFetch: Promise<void> | null = null
let inFlightInit: Promise<void> | null = null

export const useCurrencyStore = create<CurrencyStore>((set, get) => ({
  rates: null,
  isLoading: false,
  isRefreshing: false,
  isInitializing: false,
  error: null,
  initializationError: null,
  lastUpdate: null,

  loadCachedRates: async () => {
    const cachedRates = loadFromCacheStorage()
    if (cachedRates) {
      const { lastUpdate } = get()
      if (!lastUpdate || cachedRates.lastUpdated > lastUpdate) {
        set({ rates: cachedRates, lastUpdate: cachedRates.lastUpdated })
      }
    }
  },

  initializeOfflineData: async () => {
    const isInitialized = ratesStorage.getInitialDataLoaded()
    if (isInitialized) return

    if (inFlightInit) return inFlightInit

    const run = (async () => {
      set({ isInitializing: true, initializationError: null })
      try {
        await fetchAndCacheRates('USD', set)
        ratesStorage.setInitialDataLoaded(true)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to load initial data')
        crashlyticsService.recordError(err, { source: 'currencyStore.initializeOfflineData' })

        const cachedRates = loadFromCacheStorage()
        if (cachedRates) {
          set({
            rates: cachedRates,
            lastUpdate: cachedRates.lastUpdated,
            isInitializing: false,
            initializationError: null,
          })
          ratesStorage.setInitialDataLoaded(true)
        } else {
          set({ isInitializing: false, initializationError: err })
        }
      }
    })()
    inFlightInit = run
    try {
      await run
    } finally {
      inFlightInit = null
    }
  },

  retryInitialization: async () => {
    set({ isInitializing: true, initializationError: null })
    try {
      await fetchAndCacheRates('USD', set)
      ratesStorage.setInitialDataLoaded(true)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load initial data')
      crashlyticsService.recordError(err, { source: 'currencyStore.retryInitialization' })

      const cachedRates = loadFromCacheStorage()
      if (cachedRates) {
        set({
          rates: cachedRates,
          lastUpdate: cachedRates.lastUpdated,
          isInitializing: false,
          initializationError: null,
        })
        ratesStorage.setInitialDataLoaded(true)
      } else {
        set({ isInitializing: false, initializationError: err })
      }
    }
  },

  clearInitializationError: () => {
    set({ initializationError: null })
  },

  fetchRates: async (baseCurrency: string = 'USD') => {
    if (inFlightFetch) return inFlightFetch

    const { lastUpdate, rates } = get()

    // Prevent double-fetch within the same navigation event
    if (isWithinDebounce(lastUpdate)) return

    // Data is still fresh relative to backend TTL — no network call needed
    if (isWithinBackgroundRefresh(lastUpdate)) return

    const run = (async () => {
      if (rates) {
        // SWR: user already sees data — refresh silently without any spinner or error
        set({ isRefreshing: true })
        try {
          await fetchAndCacheRates(baseCurrency, set)
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error')
          crashlyticsService.recordError(error, {
            source: `currencyStore.fetchRates.background(${baseCurrency})`,
          })
          // Cache stays visible — user is unaffected
        } finally {
          set({ isRefreshing: false })
        }
      } else {
        // First load with no data: show spinner, surface error only if no fallback
        set({ isLoading: true, error: null })
        try {
          await fetchAndCacheRates(baseCurrency, set)
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error')
          crashlyticsService.recordError(err, {
            source: `currencyStore.fetchRates(${baseCurrency})`,
          })

          const cachedRates = loadFromCacheStorage()
          if (cachedRates) {
            set({ isLoading: false, rates: cachedRates, lastUpdate: cachedRates.lastUpdated })
          } else {
            set({ isLoading: false, error: { message: err.message, statusCode: undefined } })
          }
        }
      }
    })()
    inFlightFetch = run
    try {
      await run
    } finally {
      inFlightFetch = null
    }
  },

  refreshRates: async (baseCurrency: string = 'USD') => {
    const { rates } = get()
    set({ isRefreshing: true, error: null })
    try {
      await fetchAndCacheRates(baseCurrency, set)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      crashlyticsService.recordError(err, {
        source: `currencyStore.refreshRates(${baseCurrency})`,
      })
      // Suppress error if cached data is already visible — user sees valid rates
      if (!rates) {
        set({ error: { message: err.message, statusCode: undefined } })
      }
    } finally {
      set({ isLoading: false, isRefreshing: false })
    }
  },

  setRates: (rates: ExchangeRate) => {
    saveToCacheStorage(rates)
    set({ rates, lastUpdate: new Date(), error: null })
  },

  isDataStale: () => {
    const { lastUpdate } = get()
    if (!lastUpdate) return true
    return Date.now() - lastUpdate.getTime() > CACHE_CONFIG.OLD_DATA_WARNING_THRESHOLD
  },

  clearError: () => {
    set({ error: null })
  },
}))
