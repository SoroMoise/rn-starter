type SyncFn = () => void

let _syncFn: SyncFn | null = null
let _debounceTimer: ReturnType<typeof setTimeout> | null = null

export function registerBackupSyncFn(fn: SyncFn): void {
  _syncFn = fn
}

export function triggerBackupSync(): void {
  if (!_syncFn) return

  if (_debounceTimer) clearTimeout(_debounceTimer)

  _debounceTimer = setTimeout(() => {
    _debounceTimer = null
    _syncFn?.()
  }, 2000)
}

export function cancelPendingBackupSync(): void {
  if (_debounceTimer) {
    clearTimeout(_debounceTimer)
    _debounceTimer = null
  }
}
