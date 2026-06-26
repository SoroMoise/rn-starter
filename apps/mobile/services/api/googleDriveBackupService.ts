import axios from 'axios'
import { googleAuthService } from './googleAuthService'
import type { BackupData } from '@/types'

const BACKUP_FILE_NAME = 'allcurrencyconverter_backup.json'
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

type DriveFile = { id: string }
type DriveFileList = { files: DriveFile[] }

async function getAuthHeaders(): Promise<{ Authorization: string }> {
  const token = await googleAuthService.getAccessToken()
  if (!token) throw new Error('no_access_token')
  return { Authorization: `Bearer ${token}` }
}

async function findBackupFileId(): Promise<string | null> {
  const headers = await getAuthHeaders()

  const response = await axios.get<DriveFileList>(DRIVE_FILES_URL, {
    headers,
    params: {
      spaces: 'appDataFolder',
      q: `name='${BACKUP_FILE_NAME}'`,
      fields: 'files(id)',
    },
  })
  return response.data.files[0]?.id ?? null
}

export const googleDriveBackupService = {
  async uploadBackup(data: BackupData): Promise<void> {
    const headers = await getAuthHeaders()

    const body = JSON.stringify(data)
    const existingId = await findBackupFileId()

    if (existingId) {
      await axios.patch(`${DRIVE_UPLOAD_URL}/${existingId}`, body, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        params: { uploadType: 'media' },
      })
    } else {
      const boundary = 'backup_boundary'
      const metadata = JSON.stringify({ name: BACKUP_FILE_NAME, parents: ['appDataFolder'] })
      const multipart = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        metadata,
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        body,
        `--${boundary}--`,
      ].join('\r\n')

      await axios.post(DRIVE_UPLOAD_URL, multipart, {
        headers: {
          ...headers,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        params: { uploadType: 'multipart' },
      })
    }
  },

  async downloadBackup(): Promise<BackupData | null> {
    const headers = await getAuthHeaders()

    const fileId = await findBackupFileId()
    if (!fileId) return null

    const response = await axios.get<BackupData>(`${DRIVE_FILES_URL}/${fileId}`, {
      headers,
      params: { alt: 'media' },
    })
    return response.data
  },

  async deleteBackup(): Promise<void> {
    const headers = await getAuthHeaders()

    const fileId = await findBackupFileId()
    if (!fileId) return

    await axios.delete(`${DRIVE_FILES_URL}/${fileId}`, { headers })
  },
}
