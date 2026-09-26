import { BACKEND_CONFIG } from '@constants/config'
import axios from 'axios'

// One instance for every call to `apps/api`: the base URL, the timeout and the key the Worker's
// `apiKeyAuth` checks travel with each request instead of being repeated per service.
const client = axios.create({
  baseURL: BACKEND_CONFIG.URL,
  timeout: BACKEND_CONFIG.TIMEOUT,
  headers: { 'x-api-key': BACKEND_CONFIG.API_KEY },
})

// An incomplete `.env` would send every call to a relative URL with no key — a network error with
// no status, which `withRetry` takes for an outage and retries. It fails here instead, by name.
export function getBackendClient() {
  if (!BACKEND_CONFIG.URL || !BACKEND_CONFIG.API_KEY) {
    throw new Error('BACKEND_URL and BACKEND_API_KEY must be set in apps/mobile/.env')
  }
  return client
}
