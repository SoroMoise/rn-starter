export function buildLabelIndices(count: number, maxLabels = 4): Set<number> {
  if (count === 0) return new Set()
  if (count <= maxLabels) return new Set(Array.from({ length: count }, (_, i) => i))

  const indices = new Set<number>()
  indices.add(0)
  indices.add(count - 1)
  const step = (count - 1) / (maxLabels - 1)
  for (let i = 1; i < maxLabels - 1; i++) {
    indices.add(Math.round(step * i))
  }
  return indices
}
