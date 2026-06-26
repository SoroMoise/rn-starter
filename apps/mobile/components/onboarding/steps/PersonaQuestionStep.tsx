import { ThemedText } from '@/components/ui/ThemedText'
import { ALL_PERSONAS, PERSONA_CONTENT } from '@/constants/personaContent'
import type { Persona } from '@/stores/onboardingStore'
import { triggerSelection } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, Pressable, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const AUTO_ADVANCE_DELAY_MS = 300

const CARD_SHADOW = {
  shadowColor: '#312e81',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 2,
}

interface PersonaQuestionStepProps {
  selectedPersona: Persona | null
  onSelect: (persona: Persona) => void
}

export function PersonaQuestionStep({ selectedPersona, onSelect }: PersonaQuestionStepProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()

  const handleSelect = (persona: Persona) => {
    triggerSelection()
    setTimeout(() => onSelect(persona), AUTO_ADVANCE_DELAY_MS)
  }

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="flex-1">
      <LinearGradient
        colors={isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#f8faff', '#eef2ff', '#f5f3ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <View className="absolute inset-0 justify-center px-6 pt-24">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 200, damping: 30 }}>
          <ThemedText variant="display" align="center" className="mb-2 text-3xl">
            {t('onboarding.persona.title')}
          </ThemedText>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 350, damping: 30 }}>
          <ThemedText variant="body" color="muted" weight="medium" align="center" className="mb-8">
            {t('onboarding.persona.subtitle')}
          </ThemedText>
        </MotiView>

        <View className="gap-3">
          {ALL_PERSONAS.map((persona, index) => (
            <PersonaCard
              key={persona}
              persona={persona}
              isSelected={selectedPersona === persona}
              isDark={isDark}
              index={index}
              onPress={() => handleSelect(persona)}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

interface PersonaCardProps {
  persona: Persona
  isSelected: boolean
  isDark: boolean
  index: number
  onPress: () => void
}

function PersonaCard({ persona, isSelected, isDark, index, onPress }: PersonaCardProps) {
  const { t } = useTranslation()
  const content = PERSONA_CONTENT[persona]
  const scale = useSharedValue(1)
  const [hasEntered, setHasEntered] = useState(false)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 110 })
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 140 })
  }

  // The elevation shadow renders a translucent artifact while the entrance opacity
  // animates (light mode only). Apply it once the card has settled.
  const showShadow = !isDark && !isSelected && hasEntered

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      onDidAnimate={() => setHasEntered(true)}
      transition={{
        type: 'timing',
        duration: 420,
        delay: 420 + index * 80,
        easing: Easing.out(Easing.cubic),
      }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${t(content.question.labelKey)}. ${t(content.question.descKey)}`}>
        <Animated.View
          style={[animatedStyle, showShadow ? CARD_SHADOW : undefined]}
          className={`flex-row items-center gap-4 rounded-2xl border px-4 py-3.5 ${
            isSelected
              ? 'border-blue-500 bg-blue-500/10'
              : isDark
                ? 'border-white/10 bg-white/[0.06]'
                : 'border-black/[0.06] bg-white'
          }`}>
          <View
            className={`h-12 w-12 items-center justify-center rounded-xl ${
              isSelected ? 'bg-blue-500/15' : isDark ? 'bg-white/10' : 'bg-indigo-500/[0.08]'
            }`}>
            <ThemedText color="inherit" className="text-2xl">
              {content.question.emoji}
            </ThemedText>
          </View>
          <View className="flex-1">
            <ThemedText variant="heading" weight="semibold" className="mb-0.5">
              {t(content.question.labelKey)}
            </ThemedText>
            <ThemedText variant="caption" color="muted" weight="normal" numberOfLines={1}>
              {t(content.question.descKey)}
            </ThemedText>
          </View>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={22} color="#3b82f6" />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.28)'}
            />
          )}
        </Animated.View>
      </Pressable>
    </MotiView>
  )
}
