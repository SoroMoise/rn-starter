import { WidgetSparkline } from '@/components/widget/WidgetSparkline'
import { formatRateLocalized } from '@/utils/formatters'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

type Pair = {
  from: string
  to: string
  rate?: number | null
  variationPct?: number | null
  sparklinePoints?: number[]
}

export function WidgetPreviewCard({
  pairs,
  isOffline = false,
}: {
  pairs: Pair[]
  isOffline?: boolean
}) {
  const { t, i18n } = useTranslation()

  return (
    <View className="mx-4 rounded-3xl bg-zinc-900 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] uppercase tracking-wider text-zinc-400">
          {isOffline
            ? t('widget.watchlist.offline')
            : `${t('widget.watchlist.title')} · ${formatTime(new Date())}`}
        </Text>
        <View className="rounded bg-amber-400 px-2 py-[2px]">
          <Text className="text-[9px] font-bold text-stone-900">PRO</Text>
        </View>
      </View>
      <View className="mt-2">
        {pairs.slice(0, 3).map((p, idx) => (
          <View
            key={`${p.from}-${p.to}-${idx}`}
            className="flex-row items-center justify-between py-1.5">
            <View>
              <Text className="text-[13px] font-semibold text-white">
                {p.from} / {p.to}
              </Text>
              <Text className="text-[12px] text-zinc-300">
                {p.rate != null
                  ? formatRateLocalized({ rate: p.rate, decimals: 4, locale: i18n.language })
                  : '—'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <WidgetSparkline
                points={p.sparklinePoints ?? []}
                variationPct={p.variationPct ?? null}
              />
              <Text
                className={`min-w-[52px] text-right text-[12px] font-semibold ${
                  (p.variationPct ?? 0) > 0
                    ? 'text-emerald-400'
                    : (p.variationPct ?? 0) < 0
                      ? 'text-rose-400'
                      : 'text-zinc-400'
                }`}>
                {formatVariation(p.variationPct)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatVariation(v: number | null | undefined): string {
  if (v == null) return '—'
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${Math.abs(v).toFixed(2)}%`
}
