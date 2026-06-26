import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

export const backupStorage = {
  getLastSync(): string | null {
    return mmkv.getString(KEYS.BACKUP_LAST_SYNC) ?? null
  },
  setLastSync(isoDate: string): void {
    mmkv.set(KEYS.BACKUP_LAST_SYNC, isoDate)
  },

  getUserEmail(): string | null {
    return mmkv.getString(KEYS.BACKUP_USER_EMAIL) ?? null
  },
  setUserEmail(email: string): void {
    mmkv.set(KEYS.BACKUP_USER_EMAIL, email)
  },

  getLastOffered(): string | null {
    return mmkv.getString(KEYS.BACKUP_LAST_OFFERED) ?? null
  },
  setLastOffered(isoDate: string): void {
    mmkv.set(KEYS.BACKUP_LAST_OFFERED, isoDate)
  },

  clear(): void {
    mmkv.delete(KEYS.BACKUP_LAST_SYNC)
    mmkv.delete(KEYS.BACKUP_USER_EMAIL)
    mmkv.delete(KEYS.BACKUP_LAST_OFFERED)
  },
}
