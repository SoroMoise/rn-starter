import type { HistoricalRatePoint } from '@repo/shared/types/api'
import type { CachedHistoricalDay, CachedHistoricalPoint } from '../types'

interface HistoricalApiResponse {
  result: string
  base_code: string
  year: number
  month: number
  day: number
  conversion_rates: Record<string, number>
}

const VALID_PERIODS = [7, 30, 90, 270, 365]

const MAX_CONCURRENT_REQUESTS = 10
const BATCH_DELAY_MS = 100
const MIN_DATA_RATIO = 0.5

const POINT_TTL_S = 30 * 24 * 60 * 60
// Past days are immutable: a long snapshot TTL turns one upstream response
// (which contains EVERY currency) into a cache for all pairs of this base.
const DAY_SNAPSHOT_TTL_S = 400 * 24 * 60 * 60

export function isValidPeriod(days: number): boolean {
  return VALID_PERIODS.includes(days)
}

function generateDatesToFetch(days: number): Date[] {
  const today = new Date()
  const dates: Date[] = []

  for (let i = 0; i < days; i += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    dates.push(date)
  }

  return dates
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function fetchRateForDate(
  apiKey: string,
  baseCurrency: string,
  date: Date
): Promise<{ date: string; rates: Record<string, number> } | null> {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/history/${baseCurrency}/${year}/${month}/${day}`

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as HistoricalApiResponse

  if (data.result !== 'success') {
    return null
  }

  return {
    date: formatDate(date),
    rates: data.conversion_rates,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const RECENT_POINT_TTL_S = 60 * 60

function canonicalize(
  base: string,
  target: string
): { canonBase: string; canonTarget: string; inverted: boolean } {
  if (base < target) return { canonBase: base, canonTarget: target, inverted: false }
  return { canonBase: target, canonTarget: base, inverted: true }
}

function pointKey(base: string, target: string, dateStr: string): string {
  return `point:${base}:${target}:${dateStr}`
}

function dayKey(base: string, dateStr: string): string {
  return `histday:${base}:${dateStr}`
}

function isPointFresh(entry: { fetchedAt: number }, dateStr: string, todayStr: string): boolean {
  if (dateStr !== todayStr) return true // historical points are immutable

  return Math.floor(Date.now() / 1000) - entry.fetchedAt < RECENT_POINT_TTL_S
}

export async function assembleHistoricalRates(
  kv: KVNamespace,
  apiKey: string,
  base: string,
  target: string,
  days: number
): Promise<HistoricalRatePoint[]> {
  const { canonBase, canonTarget, inverted } = canonicalize(base, target)
  const dates = generateDatesToFetch(days)
  const todayStr = formatDate(new Date())

  const cachedEntries = await Promise.all(
    dates.map(async (d) => {
      const key = pointKey(canonBase, canonTarget, formatDate(d))
      const entry = await kv.get<CachedHistoricalPoint>(key, 'json')
      return { date: d, entry }
    })
  )

  const datesToFetch: Date[] = []
  const fresh: HistoricalRatePoint[] = []

  for (const { date, entry } of cachedEntries) {
    const dateStr = formatDate(date)
    if (entry && isPointFresh(entry, dateStr, todayStr)) {
      fresh.push({ date: dateStr, rate: inverted ? 1 / entry.rate : entry.rate })
    } else {
      datesToFetch.push(date)
    }
  }

  // Day-snapshot layer: another pair with the same canonical base may have
  // already paid for the upstream call — its snapshot contains our target.
  const stillToFetch: Date[] = []
  if (datesToFetch.length > 0) {
    const fetchedNow = Math.floor(Date.now() / 1000)
    const snapshots = await Promise.all(
      datesToFetch.map(async (d) => ({
        date: d,
        snapshot: await kv.get<CachedHistoricalDay>(dayKey(canonBase, formatDate(d)), 'json'),
      }))
    )
    const warmWrites: Promise<void>[] = []
    for (const { date, snapshot } of snapshots) {
      const dateStr = formatDate(date)
      const snapRate = snapshot?.rates[canonTarget]
      if (snapshot && snapRate !== undefined && isPointFresh(snapshot, dateStr, todayStr)) {
        fresh.push({ date: dateStr, rate: inverted ? 1 / snapRate : snapRate })
        warmWrites.push(
          kv
            .put(
              pointKey(canonBase, canonTarget, dateStr),
              JSON.stringify({
                rate: snapRate,
                fetchedAt: snapshot.fetchedAt,
              } satisfies CachedHistoricalPoint),
              { expirationTtl: POINT_TTL_S }
            )
            .catch(() => {})
        )
      } else {
        stillToFetch.push(date)
      }
    }
    await Promise.all(warmWrites)

    for (let i = 0; i < stillToFetch.length; i += MAX_CONCURRENT_REQUESTS) {
      const batch = stillToFetch.slice(i, i + MAX_CONCURRENT_REQUESTS)
      const results = await Promise.allSettled(
        batch.map((d) => fetchRateForDate(apiKey, canonBase, d))
      )
      const writes: Promise<void>[] = []
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const dateStr = result.value.date
          // A KV write failure must never fail the request: the data is in memory.
          writes.push(
            kv
              .put(
                dayKey(canonBase, dateStr),
                JSON.stringify({
                  rates: result.value.rates,
                  fetchedAt: fetchedNow,
                } satisfies CachedHistoricalDay),
                { expirationTtl: DAY_SNAPSHOT_TTL_S }
              )
              .catch(() => {})
          )
          const canonRate = result.value.rates[canonTarget]
          if (canonRate !== undefined) {
            fresh.push({ date: dateStr, rate: inverted ? 1 / canonRate : canonRate })
            writes.push(
              kv
                .put(
                  pointKey(canonBase, canonTarget, dateStr),
                  JSON.stringify({
                    rate: canonRate,
                    fetchedAt: fetchedNow,
                  } satisfies CachedHistoricalPoint),
                  { expirationTtl: POINT_TTL_S }
                )
                .catch(() => {})
            )
          }
        }
      }
      await Promise.all(writes)
      if (i + MAX_CONCURRENT_REQUESTS < stillToFetch.length) {
        await delay(BATCH_DELAY_MS)
      }
    }
  }

  const expectedCount = dates.length
  if (fresh.length < expectedCount * MIN_DATA_RATIO) {
    throw new Error(`Insufficient data: got ${fresh.length}/${expectedCount} data points`)
  }

  fresh.sort((a, b) => a.date.localeCompare(b.date))
  return fresh
}
