import type { HistoricalRate } from '@/types'

/**
 * Largest-Triangle-Three-Buckets downsampling.
 *
 * Reduces a dense series to `threshold` points while preserving the visual
 * shape — peaks and troughs are kept, unlike naive averaging or nth-point
 * picking. Points are evenly spaced in time (one per day), so the index is
 * used as the x coordinate. The first and last points are always retained.
 */
export function downsampleLTTB({
  data,
  threshold,
}: {
  data: HistoricalRate[]
  threshold: number
}): HistoricalRate[] {
  const n = data.length
  if (threshold >= n || threshold < 3) return data

  const sampled: HistoricalRate[] = [data[0]]
  const bucketSize = (n - 2) / (threshold - 2)
  let a = 0

  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0
    let avgY = 0
    const avgStart = Math.floor((i + 1) * bucketSize) + 1
    const avgEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n)
    const avgLength = avgEnd - avgStart
    for (let j = avgStart; j < avgEnd; j++) {
      avgX += j
      avgY += data[j].rate
    }
    avgX /= avgLength
    avgY /= avgLength

    let rangeStart = Math.floor(i * bucketSize) + 1
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1
    const pointAX = a
    const pointAY = data[a].rate

    let maxArea = -1
    let nextA = rangeStart
    for (let j = rangeStart; j < rangeEnd; j++) {
      const area =
        Math.abs((pointAX - avgX) * (data[j].rate - pointAY) - (pointAX - j) * (avgY - pointAY)) *
        0.5
      if (area > maxArea) {
        maxArea = area
        nextA = j
      }
    }

    sampled.push(data[nextA])
    a = nextA
  }

  sampled.push(data[n - 1])
  return sampled
}
