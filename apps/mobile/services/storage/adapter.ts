import type { StateStorage } from 'zustand/middleware'
import { mmkv } from './mmkv'

export const mmkvStateStorage: StateStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => {
    mmkv.set(key, value)
  },
  removeItem: (key) => {
    mmkv.delete(key)
  },
}
