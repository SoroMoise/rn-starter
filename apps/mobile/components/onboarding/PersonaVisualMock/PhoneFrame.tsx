import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

const SCREEN_GRADIENT = ['#6d28d9', '#4c1d95', '#211E50'] as const

const FRAME_SHADOW = {
  shadowColor: '#1e1b4b',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.35,
  shadowRadius: 24,
  elevation: 12,
}

interface PhoneFrameProps {
  children: ReactNode
  width?: number
  height?: number
}

export function PhoneFrame({ children, width = 260, height = 240 }: PhoneFrameProps) {
  const isDark = useThemedColor()

  return (
    <View className="items-center">
      <View
        style={[
          {
            borderRadius: 25,
            padding: 5,
            borderWidth: 1,
            backgroundColor: isDark ? '#1e1b4b' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.05)',
          },
          FRAME_SHADOW,
        ]}>
        <View className="overflow-hidden" style={{ width, height, borderRadius: 23 }}>
          <LinearGradient
            colors={SCREEN_GRADIENT}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}>
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 96 }}
              pointerEvents="none"
            />
            {children}
          </LinearGradient>
        </View>
      </View>
    </View>
  )
}

export function PhoneStatusBar() {
  return (
    <View className="flex-row items-center justify-between px-5 pt-3">
      <Text className="text-[11px] font-semibold text-white/90">{formatClock(new Date())}</Text>
      <View className="flex-row items-center gap-1.5">
        <View className="h-2 w-2 rounded-full bg-white/70" />
        <View className="h-2.5 w-4 rounded-[3px] border border-white/60" />
      </View>
    </View>
  )
}

export function PhonePageDots({ active = 0, count = 3 }: { active?: number; count?: number }) {
  return (
    <View className="flex-row justify-center gap-1.5 pb-4">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${index === active ? 'bg-white/80' : 'bg-white/30'}`}
        />
      ))}
    </View>
  )
}

function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
