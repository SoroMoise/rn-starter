import type { ThemeMode } from '@/types'
import { colorScheme } from 'nativewind'

export function applyColorScheme(theme: ThemeMode) {
  colorScheme.set(theme === 'auto' ? 'system' : theme)
}
