import { ThemedText } from '@/components/ui/ThemedText'
import type { Currency, Language } from '@/types'
import { ModalBottomSheet, ModalBottomSheetFlatList } from '@components/ui/ModalBottomSheet'
import { useFilteredCurrencies, type CurrencyWithoutFavorite } from '@hooks/useFilteredCurrencies'
import { triggerLight, triggerSelection, triggerSuccess } from '@utils/haptics'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CurrencyItem } from './CurrencyItem'

interface CurrencyMultiPickerProps {
  visible: boolean
  onClose: () => void
  onValidate: (currencies: Currency[]) => void
  preSelectedCodes?: string[]
  excludeCodes?: string[]
  minSelection?: number
  maxSelection?: number
}

export function CurrencyMultiPicker({
  visible,
  onClose,
  onValidate,
  preSelectedCodes = [],
  excludeCodes = [],
  minSelection = 0,
  maxSelection,
}: CurrencyMultiPickerProps) {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const language = i18n.language as Language

  useEffect(() => {
    if (visible) {
      setSelectedCodes(new Set(preSelectedCodes))
    }
  }, [visible, preSelectedCodes])

  const filteredCurrencies = useFilteredCurrencies({
    searchQuery,
    language,
    priorityCodes: preSelectedCodes,
    excludeCodes,
  })

  const orderedCurrencies = useFilteredCurrencies({
    searchQuery: '',
    language,
    priorityCodes: preSelectedCodes,
    excludeCodes,
  })

  const handleClose = useCallback(() => {
    setSearchQuery('')
    onClose()
  }, [onClose])

  const handleToggleSelection = useCallback(
    (currency: CurrencyWithoutFavorite) => {
      setSelectedCodes((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(currency.code)) {
          newSet.delete(currency.code)
          triggerSelection()
          return newSet
        }
        if (maxSelection && newSet.size >= maxSelection) return prev
        newSet.add(currency.code)
        triggerSelection()
        return newSet
      })
    },
    [maxSelection]
  )

  const handleValidateSelection = useCallback(() => {
    const selectedCurrencies: Currency[] = orderedCurrencies
      .filter((c) => selectedCodes.has(c.code))
      .map((c) => ({ ...c, isFavorite: false }))
    triggerSuccess()
    onValidate(selectedCurrencies)
    setSearchQuery('')
  }, [selectedCodes, orderedCurrencies, onValidate])

  const renderItem = useCallback(
    ({ item }: { item: CurrencyWithoutFavorite }) => (
      <View className="px-4">
        <CurrencyItem
          item={item}
          isSelected={selectedCodes.has(item.code)}
          onPress={() => handleToggleSelection(item)}
          language={language}
        />
      </View>
    ),
    [selectedCodes, handleToggleSelection, language]
  )

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: 76, offset: 76 * index, index }),
    []
  )

  const selectedCount = selectedCodes.size
  const isValidSelection = selectedCount >= minSelection

  return (
    <ModalBottomSheet
      visible={visible}
      onClose={handleClose}
      title={t('currency.selectCurrencies')}>
      <View className="px-4">
        <Animated.View
          className={`flex-row items-center rounded-2xl px-4 py-2 ${
            isSearchFocused
              ? 'border-2 border-blue-500 bg-white shadow-md shadow-blue-200 dark:bg-gray-800 dark:shadow-blue-900/50'
              : 'border-2 border-transparent bg-white shadow-sm shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900'
          }`}
          style={{
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isSearchFocused ? 0.2 : 0.1,
            shadowRadius: isSearchFocused ? 8 : 4,
            elevation: isSearchFocused ? 4 : 2,
          }}>
          <ThemedText color="inherit" className="mr-2 text-xl">
            🔍
          </ThemedText>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => {
              setIsSearchFocused(true)
              triggerLight()
            }}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={t('currency.searchPlaceholder')}
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-2 text-base text-gray-900 dark:text-white"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('')
                  triggerLight()
                }}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
                activeOpacity={0.7}>
                <ThemedText
                  variant="label"
                  color="inherit"
                  weight="normal"
                  className="text-gray-600 dark:text-gray-300">
                  ✕
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>

      <ModalBottomSheetFlatList
        data={filteredCurrencies}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingBottom: 150 + insets.bottom, marginTop: 10 }}
        initialNumToRender={20}
        maxToRenderPerBatch={30}
        windowSize={21}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        removeClippedSubviews
      />

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="mb-3">
          <ThemedText variant="label" color="muted" align="center">
            {t('settings.currenciesSelected', { count: selectedCount })}
            {!isValidSelection && minSelection > 0 && (
              <ThemedText color="error">
                {' '}
                {t('settings.minSelection', { count: minSelection })}
              </ThemedText>
            )}
          </ThemedText>
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleClose}
            className="flex-1 items-center justify-center rounded-xl border-2 border-gray-300 bg-white py-3 dark:border-gray-600 dark:bg-gray-700"
            activeOpacity={0.7}>
            <ThemedText
              variant="button"
              color="inherit"
              className="text-gray-700 dark:text-gray-300">
              {t('common.cancel')}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleValidateSelection}
            disabled={!isValidSelection}
            className={`flex-1 items-center justify-center rounded-xl py-3 ${
              !isValidSelection ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-500 dark:bg-blue-600'
            }`}
            activeOpacity={0.7}>
            <ThemedText variant="button" color={isValidSelection ? 'inverse' : 'muted'}>
              {t('settings.validate')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ModalBottomSheet>
  )
}
