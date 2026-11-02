import { BACKEND_CONFIG } from '@constants/config'
import axios from 'axios'

const client = axios.create({
  baseURL: BACKEND_CONFIG.URL,
  timeout: BACKEND_CONFIG.TIMEOUT,
  headers: { 'x-api-key': BACKEND_CONFIG.API_KEY },
})

export function getBackendClient() {
  if (!BACKEND_CONFIG.URL || !BACKEND_CONFIG.API_KEY) {
    throw new Error('BACKEND_URL and BACKEND_API_KEY must be set in apps/mobile/.env')
  }
  return client
}
