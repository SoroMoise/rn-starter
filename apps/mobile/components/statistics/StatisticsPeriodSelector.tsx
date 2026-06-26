import { ThemedText } from '@/components/ui/ThemedText'
import { PERIODS } from '@/constants/config'
import type { Period } from '@/types'
import { triggerLight } from '@/utils/haptics'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

type Props = {
  selectedPeriod: Period
  onSelect: (period: Period) => void
}

export function StatisticsPeriodSelector({ selectedPeriod, onSelect }: Props) {
  const { t } = useTranslation()

  return (
    <View className="flex-row overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      {PERIODS.map((period, index) => {
        const isLast = index === PERIODS.length - 1
        const isSelected = selectedPeriod === period

        return (
          <TouchableOpacity
            key={period}
            onPress={() => {
              if (!isSelected) {
                triggerLight()
                onSelect(period)
              }
            }}
            className={` w-1/5 items-center justify-center px-1 py-3 ${isSelected ? 'bg-blue-500 dark:bg-blue-600' : 'bg-white dark:bg-gray-800'} ${!isLast ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}
            activeOpacity={0.7}>
            <ThemedText
              variant="label"
              weight="semibold"
              color={isSelected ? 'inverse' : 'inherit'}
              align="center"
              className={`whitespace-nowrap ${!isSelected ? 'text-gray-700 dark:text-gray-300' : ''}`}>
              {t(`statistics.days${period}`)}
            </ThemedText>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
