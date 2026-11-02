import { onlineManager, QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import Constants from 'expo-constants'
import React from 'react'
import { getIsOnline, subscribeToNetworkStatus } from '@/hooks/useNetworkStatus'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { mmkv } from '@/services/storage/mmkv'
import { isNonRetryableError } from '@/utils/apiErrors'

const APP_VERSION = Constants.expoConfig?.version ?? 'dev'
const QUERY_RETRIES = 3

onlineManager.setEventListener((setOnline) => {
  setOnline(getIsOnline())
  return subscribeToNetworkStatus(setOnline)
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => failureCount < QUERY_RETRIES && !isNonRetryableError(error),
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      networkMode: 'offlineFirst',
    },
  },
})

function safeMmkv<T>(fn: () => T, source: string): T | undefined {
  try {
    return fn()
  } catch (err) {
    crashlyticsService.recordError(
      err instanceof Error ? err : new Error('mmkv operation failed'),
      { source }
    )
    return undefined
  }
}

const mmkvPersister = createAsyncStoragePersister({
  storage: {
    getItem: (k) => safeMmkv(() => mmkv.getString(k) ?? null, 'QueryProvider.getItem') ?? null,
    setItem: (k, v) => {
      safeMmkv(() => mmkv.set(k, v), 'QueryProvider.setItem')
    },
    removeItem: (k) => {
      safeMmkv(() => mmkv.delete(k), 'QueryProvider.removeItem')
    },
  },
  key: 'rq-cache-v1',
  throttleTime: 1000,
})

const PERSISTED_QUERY_KEYS: readonly string[] = []

const persistOptions = {
  persister: mmkvPersister,
  maxAge: 24 * 60 * 60 * 1000,
  buster: APP_VERSION,
  dehydrateOptions: {
    shouldDehydrateQuery: (q: { queryKey: readonly unknown[]; state: { status: string } }) =>
      q.state.status === 'success' && PERSISTED_QUERY_KEYS.includes(String(q.queryKey[0])),
  },
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  )
}
