import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import Ionicons from '@expo/vector-icons/Ionicons'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, View } from 'react-native'

const STAR_COUNT = 5

interface Props {
  visible: boolean
  promptTitle?: string
  promptMessage?: string
  onLater: () => void
  onRate: (stars: number) => void
}

export function RatingModal({ visible, promptTitle, promptMessage, onLater, onRate }: Props) {
  const { t } = useTranslation()
  const [selectedRating, setSelectedRating] = useState(0)

  useEffect(() => {
    if (!visible) setSelectedRating(0)
  }, [visible])

  const handleStarPress = useCallback((index: number) => {
    setSelectedRating(index + 1)
  }, [])

  const handleSubmit = useCallback(() => {
    if (selectedRating === 0) return
    onRate(selectedRating)
  }, [selectedRating, onRate])

  const isDisabled = selectedRating === 0
  const title = promptTitle ?? t('appRating.title')
  const message = promptMessage ?? t('appRating.message')

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={onLater}>
        <Pressable
          className="w-full gap-4 rounded-2xl bg-white p-6 dark:bg-gray-800"
          onPress={(e) => e.stopPropagation()}>
          <ThemedText variant="heading" align="center">
            {title}
          </ThemedText>

          <ThemedText variant="body" color="muted" align="center">
            {message}
          </ThemedText>

          <View className="flex-row justify-center gap-2">
            {Array.from({ length: STAR_COUNT }, (_, index) => (
              <Pressable key={index} onPress={() => handleStarPress(index)} className="p-1">
                <Ionicons
                  name={index < selectedRating ? 'star' : 'star-outline'}
                  size={40}
                  color="#F59E0B"
                />
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onLater}
              className="flex-[0.7] items-center justify-center rounded-xl border border-gray-200 py-3 dark:border-gray-600">
              <ThemedText variant="label" weight="semibold">
                {t('appRating.laterButton')}
              </ThemedText>
            </Pressable>
            <GradientButton
              onPress={handleSubmit}
              disabled={isDisabled}
              colors={['#6366F1', '#8B5CF6']}
              style={{ flex: 1, borderRadius: 12 }}
              gradientStyle={{ paddingVertical: 14, paddingHorizontal: 16 }}>
              <ThemedText variant="label" weight="bold" color="inverse">
                {t('appRating.rateButton')}
              </ThemedText>
            </GradientButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
