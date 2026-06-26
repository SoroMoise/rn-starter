import { ThemedText } from '@/components/ui/ThemedText'
import type { Currency, Language } from '@/types'
import {
  ModalBottomSheet,
  ModalBottomSheetFlatList,
  type ModalBottomSheetRef,
} from '@components/ui/ModalBottomSheet'
import { useFilteredCurrencies, type CurrencyWithoutFavorite } from '@hooks/useFilteredCurrencies'
import { triggerLight, triggerSelection, triggerSuccess } from '@utils/haptics'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CurrencyItem } from './CurrencyItem'

interface CurrencyPickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (currency: Currency) => void
  selectedCode?: string
  favorites?: string[]
}

export function CurrencyPicker({
  visible,
  onClose,
  onSelect,
  selectedCode,
  favorites = [],
}: CurrencyPickerProps) {
  const { t, i18n } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const insets = useSafeAreaInsets()
  const language = i18n.language as Language
  const modalRef = useRef<ModalBottomSheetRef>(null)

  const filteredCurrencies = useFilteredCurrencies({
    searchQuery,
    language,
    priorityCodes: favorites,
  })

  const handleClose = useCallback(() => {
    setSearchQuery('')
    onClose()
  }, [onClose])

  const handleSelect = useCallback(
    (currency: Currency) => {
      triggerSuccess()
      onSelect(currency)
      setSearchQuery('')
      modalRef.current?.close()
    },
    [onSelect]
  )

  const handleItemPress = useCallback(
    (item: CurrencyWithoutFavorite) => {
      triggerSelection()
      handleSelect({ ...item, isFavorite: favorites.includes(item.code) })
    },
    [handleSelect, favorites]
  )

  const renderItem = useCallback(
    ({ item }: { item: CurrencyWithoutFavorite }) => (
      <View className="px-4">
        <CurrencyItem
          item={item}
          isSelected={item.code === selectedCode}
          isFavorite={favorites.includes(item.code)}
          onPress={() => handleItemPress(item)}
          language={language}
        />
      </View>
    ),
    [selectedCode, favorites, handleItemPress, language]
  )

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: 76, offset: 76 * index, index }),
    []
  )

  return (
    <ModalBottomSheet
      ref={modalRef}
      visible={visible}
      onClose={handleClose}
      title={t('currency.selectCurrency')}>
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 20, marginTop: 10 }}
        initialNumToRender={20}
        maxToRenderPerBatch={30}
        windowSize={21}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        removeClippedSubviews
      />
    </ModalBottomSheet>
  )
}
