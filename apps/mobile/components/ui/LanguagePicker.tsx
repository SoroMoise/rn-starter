import { ThemedText } from '@/components/ui/ThemedText'
import type { Language } from '@/types'
import { LANGUAGES, type LanguageConfig } from '@constants/languages'
import { triggerLight, triggerSelection, triggerSuccess } from '@utils/haptics'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, TextInput, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ModalBottomSheet, ModalBottomSheetFlatList } from './ModalBottomSheet'

interface LanguagePickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (language: Language) => void
  selectedLanguage: Language
}

export function LanguagePicker({
  visible,
  onClose,
  onSelect,
  selectedLanguage,
}: LanguagePickerProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const filteredLanguages = useMemo(() => {
    const query = searchQuery.toLowerCase()

    if (query) {
      return LANGUAGES.filter(
        (language) =>
          language.code.toLowerCase().includes(query) ||
          language.nativeName.toLowerCase().includes(query)
      )
    }

    const TOP_COUNT = 5
    const index = LANGUAGES.findIndex((language) => language.code === selectedLanguage)
    if (index < TOP_COUNT) return LANGUAGES

    const reordered = [...LANGUAGES]
    const [current] = reordered.splice(index, 1)
    reordered.unshift(current)
    return reordered
  }, [searchQuery, selectedLanguage])

  const handleClose = useCallback(() => {
    setSearchQuery('')
    onClose()
  }, [onClose])

  const handleSelect = useCallback(
    (language: Language) => {
      triggerSuccess()
      onSelect(language)
      setSearchQuery('')
      onClose()
    },
    [onSelect, onClose]
  )

  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true)
    triggerLight()
  }, [])

  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    triggerLight()
  }, [])

  const handleItemPress = useCallback(
    (languageCode: Language) => {
      triggerSelection()
      handleSelect(languageCode)
    },
    [handleSelect]
  )

  const renderItem = useCallback(
    ({ item }: { item: LanguageConfig }) => {
      const isSelected = item.code === selectedLanguage

      return (
        <View className="px-4">
          <Pressable
            onPress={() => handleItemPress(item.code)}
            className={`mb-2 flex-row items-center justify-between rounded-2xl px-3 py-2 shadow-sm ${
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
                  {item.nativeName}
                </ThemedText>
                <ThemedText variant="label" color="muted" weight="normal">
                  {item.code.toUpperCase()}
                </ThemedText>
              </View>
            </View>

            {isSelected && (
              <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                <ThemedText variant="heading" color="inverse">
                  ✓
                </ThemedText>
              </View>
            )}
          </Pressable>
        </View>
      )
    },
    [selectedLanguage, handleItemPress]
  )

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: 76,
      offset: 76 * index,
      index,
    }),
    []
  )

  return (
    <ModalBottomSheet visible={visible} onClose={handleClose} title={t('settings.selectLanguage')}>
      <SafeAreaView edges={['bottom']} className="flex-1">
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
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder={t('settings.searchLanguage')}
              placeholderTextColor="#9CA3AF"
              className="flex-1 py-2 text-base text-gray-900 dark:text-white"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
                <TouchableOpacity
                  onPress={clearSearch}
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
          data={filteredLanguages}
          renderItem={renderItem}
          keyExtractor={(item) => item.code}
          getItemLayout={getItemLayout}
          contentContainerStyle={{ paddingBottom: 20, marginTop: 10 }}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={21}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          removeClippedSubviews
        />
      </SafeAreaView>
    </ModalBottomSheet>
  )
}
