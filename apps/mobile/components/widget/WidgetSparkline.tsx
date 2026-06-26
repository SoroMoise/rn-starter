import React, { useMemo } from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

const SPARKLINE_COLOR = {
  up: '#34d399',
  down: '#fb7185',
  neutral: '#a1a1aa',
} as const

export function WidgetSparkline({
  points,
  variationPct,
  width = 56,
  height = 22,
}: {
  points: number[]
  variationPct: number | null
  width?: number
  height?: number
}) {
  const path = useMemo(() => {
    if (points.length < 2) return null

    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const padding = 2
    const innerHeight = height - padding * 2
    const stepX = width / (points.length - 1)

    return points
      .map((value, i) => {
        const x = i * stepX
        const y = padding + innerHeight - ((value - min) / range) * innerHeight
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }, [points, width, height])

  const color =
    variationPct == null || variationPct === 0
      ? SPARKLINE_COLOR.neutral
      : variationPct > 0
        ? SPARKLINE_COLOR.up
        : SPARKLINE_COLOR.down

  if (!path) return <View style={{ width, height }} />

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path
          d={path}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  )
}
