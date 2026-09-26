export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export interface Env {
  API_RATE_LIMITER: RateLimiterBinding
  ENTITLEMENT_CACHE: KVNamespace
  API_KEY: string
  FIREBASE_PRIVATE_KEY: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PROJECT_ID: string
  REVENUECAT_SECRET_API_KEY?: string
  REVENUECAT_PROJECT_ID?: string
}
