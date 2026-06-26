import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import Constants from 'expo-constants'
import React from 'react'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { mmkv } from '@/services/storage/mmkv'

const APP_VERSION = Constants.expoConfig?.version ?? 'dev'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 3,
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

const persistOptions = {
  persister: mmkvPersister,
  maxAge: 24 * 60 * 60 * 1000,
  buster: APP_VERSION,
  dehydrateOptions: {
    shouldDehydrateQuery: (q: { queryKey: readonly unknown[]; state: { status: string } }) =>
      q.queryKey[0] === 'historicalRates' && q.state.status === 'success',
  },
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  )
}
