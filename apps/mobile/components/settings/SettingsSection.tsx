import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={`mb-3 ${className ?? ''}`}>{children}</View>
}

type SectionContentProps = ViewProps & {
  overflowHidden?: boolean
}

export function SectionContent({
  children,
  className,
  overflowHidden = true,
  ...props
}: SectionContentProps) {
  return (
    <View
      className={`${overflowHidden ? 'overflow-hidden' : ''} rounded-2xl bg-white dark:bg-gray-800 ${className ?? ''}`}
      {...props}>
      {children}
    </View>
  )
}

export function SectionHeader({ children }: { children: string }) {
  return null

  // return (
  //   <ThemedText variant="sectionHeader" color="subtle" className="mb-2 ml-1">
  //     {children}
  //   </ThemedText>
  // )
}

export function Divider() {
  return <View className="mx-4 h-px bg-gray-100 dark:bg-gray-700" />
}
