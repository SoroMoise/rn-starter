import { BACKEND_CONFIG } from '@constants/config'
import axios from 'axios'

// One instance for every call to `apps/api`: the base URL, the timeout and the key the Worker's
// `apiKeyAuth` checks travel with each request instead of being repeated per service.
export const backendClient = axios.create({
  baseURL: BACKEND_CONFIG.URL,
  timeout: BACKEND_CONFIG.TIMEOUT,
  headers: { 'x-api-key': BACKEND_CONFIG.API_KEY },
})
