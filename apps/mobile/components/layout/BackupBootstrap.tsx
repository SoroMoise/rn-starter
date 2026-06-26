import { useBackupStore } from '@/stores/backupStore'
import { useEffect } from 'react'

export function BackupBootstrap() {
  const initializeBackup = useBackupStore((s) => s.initialize)

  useEffect(() => {
    void initializeBackup()
  }, [initializeBackup])

  return null
}
