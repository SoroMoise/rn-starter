import { create } from 'zustand'

export interface PendingAlertDeepLink {
  alertId: string
  fromCurrency: string
  toCurrency: string
}

interface DeepLinkState {
  pendingAlert: PendingAlertDeepLink | null
  setPendingAlert: (pending: PendingAlertDeepLink | null) => void
  consumePendingAlert: () => PendingAlertDeepLink | null
}

export const useDeepLinkStore = create<DeepLinkState>((set, get) => ({
  pendingAlert: null,
  setPendingAlert: (pendingAlert) => set({ pendingAlert }),
  consumePendingAlert: () => {
    const pending = get().pendingAlert
    if (pending) set({ pendingAlert: null })
    return pending
  },
}))
