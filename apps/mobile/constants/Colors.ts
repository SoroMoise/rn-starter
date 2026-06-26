const tintColorLight = '#2f95dc'
const tintColorDark = '#25A4FF'

export const SCREEN_BACKGROUND = {
  light: '#f9fafb',
  dark: '#111827',
} as const

export default {
  light: {
    text: '#000000',
    background: '#ffffff',
    screenBackground: SCREEN_BACKGROUND.light,
    tint: tintColorLight,
    tabIcon: '#90a0b0',
    tabIconFocused: tintColorLight,
    tabText: '#90a0b0',
    tabTextFocused: tintColorLight,
    card: '#f2f2f2',
    border: '#e5e5e5',
    primary: tintColorLight,
    primaryMuted: '#2f95dc20',
    textMuted: '#6b7280',
    tabBarBackground: '#ffffffee',
    tabBarBorder: '#e2e8f0',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    screenBackground: SCREEN_BACKGROUND.dark,
    tint: tintColorDark,
    tabIcon: '#64748b',
    tabIconFocused: tintColorDark,
    tabText: '#64748b',
    tabTextFocused: tintColorDark,
    card: '#1f2937',
    border: '#333',
    primary: tintColorDark,
    primaryMuted: '#25A4FF18',
    textMuted: '#9ca3af',
    tabBarBackground: '#0a0a0aee',
    tabBarBorder: '#1e293b',
  },
}

export const shadows = (isDark: boolean) => ({
  small: {
    shadowColor: isDark ? '#ffffff0d' : '#00000026',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  medium: {
    shadowColor: isDark ? '#ffffff1a' : '#00000040',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  large: {
    shadowColor: isDark ? '#ffffff4d' : '#00000059',
    shadowOffset: { width: 0, height: isDark ? -2 : 8 },
    shadowOpacity: 1,
    shadowRadius: isDark ? 20 : 16,
  },
})
