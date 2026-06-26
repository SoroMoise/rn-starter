import type { Currency, Language } from '@/types'
import { getCurrencyName } from '@utils/currency'
import React from 'react'
import { Pressable, View } from 'react-native'
import { ThemedText } from '@/components/ui/ThemedText'

interface CurrencyItemProps {
  item: Pick<Currency, 'code' | 'flag' | 'localizedNames' | 'name' | 'symbol'>
  isSelected: boolean
  onPress: () => void
  language: Language
  isFavorite?: boolean
}

export const CurrencyItem = React.memo(
  ({ item, isSelected, onPress, language, isFavorite }: CurrencyItemProps) => {
    return (
      <Pressable
        onPress={onPress}
        className={`mb-1 flex-row items-center justify-between rounded-2xl px-3 py-2 shadow-sm ${
          isSelected
            ? 'bg-blue-50 shadow-blue-100 dark:bg-blue-900/30 dark:shadow-none'
            : 'bg-white shadow-gray-200 dark:bg-gray-800 dark:shadow-none'
        }`}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowOffset: { width: 0, height: pressed ? 2 : 4 },
          shadowOpacity: pressed ? 0.1 : 0.15,
          shadowRadius: pressed ? 4 : 8,
          elevation: pressed ? 2 : 4,
        })}>
        <View className="flex-1 flex-row items-center gap-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700/50">
            <ThemedText color="inherit" className="text-2xl">
              {item.flag}
            </ThemedText>
          </View>

          <View className="flex-1">
            <ThemedText variant="body" weight="bold">
              {item.code}
            </ThemedText>
            <ThemedText variant="label" color="muted" weight="normal" numberOfLines={1}>
              {getCurrencyName(item, language)}
            </ThemedText>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {isFavorite && (
            <ThemedText color="inherit" className="text-xl">
              ⭐
            </ThemedText>
          )}
          {isSelected && (
            <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-500">
              <ThemedText variant="body" weight="bold" color="inverse">
                ✓
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    )
  },
  (prevProps, nextProps) =>
    prevProps.item.code === nextProps.item.code &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.language === nextProps.language &&
    prevProps.isFavorite === nextProps.isFavorite
)

CurrencyItem.displayName = 'CurrencyItem'
