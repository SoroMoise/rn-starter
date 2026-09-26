import type { Env } from '../types'

const RC_API_BASE = 'https://api.revenuecat.com/v2'

const CACHE_PREFIX = 'premium:'
const POSITIVE_CACHE_MAX_S = 6 * 60 * 60
const NEGATIVE_CACHE_S = 60
// Cloudflare KV refuses an expirationTtl below 60 seconds.
const MIN_CACHE_S = 60

// RevenueCat did not answer: the tier is unknown, which is not "not premium". The caller refuses
// without undoing anything, and the next request asks again.
export class EntitlementUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntitlementUnavailableError'
  }
}

type ActiveEntitlement = { entitlement_id: string; expires_at?: number | null }
type ListResponse<T> = { items?: T[] }

async function rcGet<T>({
  path,
  env,
}: {
  path: string
  env: Env
}): Promise<{ status: number; body: T | null }> {
  let res: Response
  try {
    res = await fetch(`${RC_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}`,
        Accept: 'application/json',
      },
    })
  } catch (err) {
    throw new EntitlementUnavailableError(`revenuecat_fetch_failed: ${(err as Error).message}`)
  }

  if (res.status === 404) return { status: 404, body: null }
  if (!res.ok) throw new EntitlementUnavailableError(`revenuecat_status_${res.status}`)
  return { status: res.status, body: (await res.json()) as T }
}

// The store owns the grace period after a failed payment: Play and Apple keep the subscription
// giving access through it, so RevenueCat still lists the entitlement as active. The active list is
// the whole answer — no window of our own, no fallback on the subscriptions. Times are epoch ms.
async function resolvePremium({
  rcCustomerId,
  env,
}: {
  rcCustomerId: string
  env: Env
}): Promise<{ isPremium: boolean; expiresAtMs: number | null }> {
  const customer = `/projects/${env.REVENUECAT_PROJECT_ID}/customers/${encodeURIComponent(rcCustomerId)}`
  const active = await rcGet<ListResponse<ActiveEntitlement>>({
    path: `${customer}/active_entitlements`,
    env,
  })
  if (active.status === 404) return { isPremium: false, expiresAtMs: null }

  // v2 names an entitlement by its internal id (entl…), never by the lookup key the app reads
  // (`ENTITLEMENT_PREMIUM`), so nothing here matches a name. The starter sells one entitlement and
  // any active one is it, lifetime and promotional grants included. An app that adds a second one
  // keeps only the premium one's `entitlement_id` here, or this says yes for the wrong purchase.
  const items = active.body?.items ?? []
  if (items.length === 0) return { isPremium: false, expiresAtMs: null }

  let latestExpiryMs = 0
  for (const item of items) {
    if (item.expires_at == null) return { isPremium: true, expiresAtMs: null }
    latestExpiryMs = Math.max(latestExpiryMs, item.expires_at)
  }
  return { isPremium: true, expiresAtMs: latestExpiryMs }
}

function positiveTtl({ expiresAtMs, nowMs }: { expiresAtMs: number | null; nowMs: number }) {
  if (expiresAtMs === null) return POSITIVE_CACHE_MAX_S
  const remaining = Math.floor((expiresAtMs - nowMs) / 1000)
  return Math.max(MIN_CACHE_S, Math.min(POSITIVE_CACHE_MAX_S, remaining))
}

let warnedUnconfigured = false

// Inert until both RevenueCat settings are set: a Worker deployed before them lets every caller
// through rather than refusing the subscribers too. It says so once per isolate, in the logs.
export async function isPremiumCustomer({
  rcCustomerId,
  env,
}: {
  rcCustomerId: string
  env: Env
}): Promise<boolean> {
  if (!env.REVENUECAT_SECRET_API_KEY || !env.REVENUECAT_PROJECT_ID) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true
      console.warn(
        'entitlement check inert: REVENUECAT_SECRET_API_KEY or REVENUECAT_PROJECT_ID unset'
      )
    }
    return true
  }

  const cacheKey = `${CACHE_PREFIX}${rcCustomerId}`
  const cached = await env.ENTITLEMENT_CACHE.get<{ isPremium: boolean }>(cacheKey, 'json')
  if (cached) return cached.isPremium

  const { isPremium, expiresAtMs } = await resolvePremium({ rcCustomerId, env })
  try {
    await env.ENTITLEMENT_CACHE.put(cacheKey, JSON.stringify({ isPremium }), {
      expirationTtl: isPremium ? positiveTtl({ expiresAtMs, nowMs: Date.now() }) : NEGATIVE_CACHE_S,
    })
  } catch (err) {
    console.warn('entitlement cache write failed', err)
  }
  return isPremium
}
