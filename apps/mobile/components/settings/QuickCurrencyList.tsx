import { ThemedText } from '@/components/ui/ThemedText'
import { QUICK_CONVERSIONS_CONFIG } from '@constants/config'
import { getCurrencyByCode } from '@constants/currencies'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

type Props = {
  quickCurrencies: string[]
  onRemove: (code: string) => void
  onAdd: () => void
}

export function QuickCurrencyList({ quickCurrencies, onRemove, onAdd }: Props) {
  const { t } = useTranslation()
  const canRemove = quickCurrencies.length > QUICK_CONVERSIONS_CONFIG.MIN_QUICK_CURRENCIES

  return (
    <View className="p-4">
      <ThemedText variant="body" color="dimmed" weight="medium" className="mb-3">
        {t('settings.quickConversionsDescription')}
      </ThemedText>
      <View className="mb-3 flex-row flex-wrap gap-1.5">
        {quickCurrencies.map((code) => {
          const currency = getCurrencyByCode(code)
          if (!currency) return null
          return (
            <View
              key={code}
              className="flex-row items-center gap-1.5 rounded-full bg-gray-100 py-[4px] pl-2.5 pr-1.5 transition-all duration-200 active:scale-95 active:bg-gray-200 dark:bg-gray-700 active:dark:bg-gray-600">
              <ThemedText color="inherit" className="text-base">
                {currency.flag}
              </ThemedText>
              <ThemedText
                variant="label"
                weight="semibold"
                color="inherit"
                className="text-gray-800 dark:text-gray-200">
                {currency.code}
              </ThemedText>
              <TouchableOpacity
                onPress={() => onRemove(code)}
                disabled={!canRemove}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Ionicons name="close-circle" size={16} color={canRemove ? '#ef4444' : '#9ca3af'} />
              </TouchableOpacity>
            </View>
          )
        })}
      </View>
      <TouchableOpacity
        onPress={onAdd}
        className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 py-2.5 dark:border-blue-500/30"
        activeOpacity={0.7}>
        <Ionicons name="add" size={18} color="#3b82f6" />
        <ThemedText variant="label" weight="semibold" color="primary">
          {t('settings.addCurrency')}
        </ThemedText>
      </TouchableOpacity>
    </View>
  )
}
