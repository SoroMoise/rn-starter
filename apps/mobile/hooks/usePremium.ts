import { SubscriptionContext } from '@/contexts/SubscriptionContext'
import { useContext } from 'react'

export function usePremium() {
  return useContext(SubscriptionContext)
}
