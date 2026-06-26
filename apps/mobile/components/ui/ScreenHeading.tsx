import type { ReactNode } from 'react'
import { View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'

type ScreenHeadingProps = {
  title: string
  subtitle?: string
  className?: string
  action?: ReactNode
}

export function ScreenHeading({ title, subtitle, className = 'mb-4', action }: ScreenHeadingProps) {
  const textBlock = (
    <>
      <ThemedText variant="title" className="tracking-tighter">
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText variant="label" color="muted" weight="normal" className="mt-1 tracking-tighter">
          {subtitle}
        </ThemedText>
      ) : null}
    </>
  )

  if (!action) {
    return <View className={className}>{textBlock}</View>
  }

  return (
    <View className={`${className} flex-row items-end justify-between`}>
      <View className="mr-3 flex-1">{textBlock}</View>
      {action}
    </View>
  )
}
