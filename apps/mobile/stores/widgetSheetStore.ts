import { create } from 'zustand'

interface WidgetSheetState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useWidgetSheetStore = create<WidgetSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
