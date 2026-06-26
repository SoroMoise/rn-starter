const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/

function parseHHMM(value: string): number | null {
  const match = HH_MM.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function isQuietNow({
  now,
  start,
  end,
}: {
  now: Date
  start: string
  end: string
}): boolean {
  const startMin = parseHHMM(start)
  const endMin = parseHHMM(end)
  if (startMin === null || endMin === null) return false
  if (startMin === endMin) return false

  const nowMin = now.getHours() * 60 + now.getMinutes()

  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin
  }
  return nowMin >= startMin || nowMin < endMin
}

export function formatQuietWindowDuration({ start, end }: { start: string; end: string }): number {
  const startMin = parseHHMM(start)
  const endMin = parseHHMM(end)

  if (startMin === null || endMin === null) return 0
  if (startMin === endMin) return 0

  const diff = endMin - startMin

  return diff > 0 ? diff : diff + 24 * 60
}
