import { AD_REWARDED_FREE_DURATION_MINUTES } from '@/constants/admob'
import { adFreeStorage } from '@/services/storage/domains/adFree'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type AdFreeContextValue = {
  adFreeUntil: number | null
  isAdFreeActive: boolean
  activateAdFreeReward: () => Promise<void>
}

const initial: AdFreeContextValue = {
  adFreeUntil: null,
  isAdFreeActive: false,
  activateAdFreeReward: async () => {},
}

const AdFreeContext = createContext<AdFreeContextValue>(initial)

export const AdFreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adFreeUntil, setAdFreeUntilState] = useState<number | null>(() => {
    const stored = adFreeStorage.getUntil()
    if (stored !== null && stored <= Date.now()) {
      adFreeStorage.setUntil(null)
      return null
    }
    return stored
  })

  useEffect(() => {
    if (adFreeUntil === null) return
    const remaining = adFreeUntil - Date.now()
    if (remaining <= 0) {
      setAdFreeUntilState(null)
      adFreeStorage.setUntil(null)
      return
    }
    const timeout = setTimeout(() => {
      setAdFreeUntilState(null)
      adFreeStorage.setUntil(null)
    }, remaining)
    return () => clearTimeout(timeout)
  }, [adFreeUntil])

  useEffect(() => {
    return adFreeStorage.subscribe(() => {
      setAdFreeUntilState(adFreeStorage.getUntil())
    })
  }, [])

  const isAdFreeActive = adFreeUntil !== null

  const activateAdFreeReward = useCallback(async () => {
    const until = Date.now() + AD_REWARDED_FREE_DURATION_MINUTES * 60 * 1000
    adFreeStorage.setUntil(until)
    setAdFreeUntilState(until)
  }, [])

  const value = useMemo(
    () => ({
      adFreeUntil,
      isAdFreeActive,
      activateAdFreeReward,
    }),
    [adFreeUntil, isAdFreeActive, activateAdFreeReward]
  )

  return <AdFreeContext.Provider value={value}>{children}</AdFreeContext.Provider>
}

export const useAdFree = () => useContext(AdFreeContext)
