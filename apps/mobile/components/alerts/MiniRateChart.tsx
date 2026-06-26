import { useThemedColor } from '@hooks/useThemedColor'
import React, { useMemo } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg'

interface Props {
  data: { date: string; rate: number }[]
  targetRate: number | null
  variationZone?: { baselineRate: number; variationPercent: number } | null
  width: number
  height?: number
}

const LINE_COLOR = '#3b82f6'
const TARGET_COLOR = '#f59e0b'

export function MiniRateChart({ data, targetRate, variationZone, width, height = 80 }: Props) {
  const isDark = useThemedColor()

  const geometry = useMemo(() => {
    if (data.length < 2) return null

    const rates = data.map((d) => d.rate)
    const target = targetRate != null && Number.isFinite(targetRate) ? targetRate : null

    const variationBounds = variationZone
      ? {
          upper: variationZone.baselineRate * (1 + variationZone.variationPercent / 100),
          lower: variationZone.baselineRate * (1 - variationZone.variationPercent / 100),
        }
      : null

    const candidates = [
      ...rates,
      ...(target != null ? [target] : []),
      ...(variationBounds ? [variationBounds.upper, variationBounds.lower] : []),
      ...(variationZone ? [variationZone.baselineRate] : []),
    ]

    const minRate = Math.min(...candidates)
    const maxRate = Math.max(...candidates)
    const range = maxRate - minRate || Math.abs(minRate) || 1
    const padding = range * 0.12
    const yMin = minRate - padding
    const yMax = maxRate + padding
    const yRange = yMax - yMin

    const toX = (i: number) => (i / (data.length - 1)) * width
    const toY = (rate: number) => height - ((rate - yMin) / yRange) * height

    const pathSegments = data.map(
      (d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(d.rate).toFixed(2)}`
    )
    const linePath = pathSegments.join(' ')
    const areaPath = `${linePath} L ${width.toFixed(2)} ${height} L 0 ${height} Z`

    const targetY = target != null ? toY(target) : null
    const lastPoint = { x: toX(data.length - 1), y: toY(rates[rates.length - 1]) }
    const variationLines = variationBounds
      ? {
          baselineY: toY(variationZone!.baselineRate),
          upperY: toY(variationBounds.upper),
          lowerY: toY(variationBounds.lower),
        }
      : null

    return { linePath, areaPath, targetY, lastPoint, variationLines }
  }, [data, targetRate, variationZone, width, height])

  if (!geometry) {
    return <View style={{ width, height }} />
  }

  const gradientId = `mini-chart-gradient-${isDark ? 'dark' : 'light'}`

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={LINE_COLOR} stopOpacity={isDark ? 0.32 : 0.22} />
            <Stop offset="1" stopColor={LINE_COLOR} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={geometry.areaPath} fill={`url(#${gradientId})`} />
        <Path
          d={geometry.linePath}
          stroke={LINE_COLOR}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={geometry.lastPoint.x} cy={geometry.lastPoint.y} r={3} fill={LINE_COLOR} />
        {geometry.targetY != null && (
          <>
            <Line
              x1={0}
              y1={geometry.targetY}
              x2={width}
              y2={geometry.targetY}
              stroke={TARGET_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            <Circle cx={width - 4} cy={geometry.targetY} r={3.5} fill={TARGET_COLOR} />
          </>
        )}
        {geometry.variationLines && (
          <>
            <Line
              x1={0}
              y1={geometry.variationLines.baselineY}
              x2={width}
              y2={geometry.variationLines.baselineY}
              stroke={TARGET_COLOR}
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.6}
            />
            <Line
              x1={0}
              y1={geometry.variationLines.upperY}
              x2={width}
              y2={geometry.variationLines.upperY}
              stroke={TARGET_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            <Line
              x1={0}
              y1={geometry.variationLines.lowerY}
              x2={width}
              y2={geometry.variationLines.lowerY}
              stroke={TARGET_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
          </>
        )}
      </Svg>
    </View>
  )
}
