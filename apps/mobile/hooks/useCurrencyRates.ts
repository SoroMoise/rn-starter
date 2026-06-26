import NetInfo from '@react-native-community/netinfo'
import { useCurrencyStore } from '@stores/currencyStore'
import { useCallback, useEffect } from 'react'
import { AppState } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

export function useCurrencyRates(baseCurrency: string = 'USD', autoFetch: boolean = true) {
  const {
    rates,
    isLoading,
    isRefreshing,
    error,
    fetchRates,
    refreshRates,
    loadCachedRates,
    clearError,
  } = useCurrencyStore(
    useShallow((s) => ({
      rates: s.rates,
      isLoading: s.isLoading,
      isRefreshing: s.isRefreshing,
      error: s.error,
      fetchRates: s.fetchRates,
      refreshRates: s.refreshRates,
      loadCachedRates: s.loadCachedRates,
      clearError: s.clearError,
    }))
  )

  // Initial mount: load cache immediately, then fetch from network if online
  useEffect(() => {
    const init = async () => {
      await loadCachedRates().catch(() => {})
      if (!autoFetch) return
      const networkState = await NetInfo.fetch()
      if (networkState.isConnected) fetchRates(baseCurrency)
    }
    void init()
  }, [baseCurrency, autoFetch, loadCachedRates, fetchRates])

  // Foreground resume: silently refresh when the user returns to the app
  useEffect(() => {
    if (!autoFetch) return
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState !== 'active') return
      const networkState = await NetInfo.fetch()
      if (networkState.isConnected) fetchRates(baseCurrency)
    })
    return () => sub.remove()
  }, [baseCurrency, autoFetch, fetchRates])

  const handleRefresh = useCallback(async () => {
    // If offline, abort silently — no error shown, pull-to-refresh spinner just stops
    const networkState = await NetInfo.fetch()
    if (!networkState.isConnected) return null
    await refreshRates(baseCurrency)
    return useCurrencyStore.getState().error
  }, [baseCurrency, refreshRates])

  return {
    rates,
    isLoading,
    isRefreshing,
    error,
    refresh: handleRefresh,
    clearError,
  }
}
