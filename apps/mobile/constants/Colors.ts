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

// Two fixed sets rather than a fresh object per call: consumers spread these into
// style arrays, where a new identity on every render defeats every memo downstream.
const SHADOWS = {
  light: {
    small: {
      shadowColor: '#00000026',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
    },
    medium: {
      shadowColor: '#00000040',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    large: {
      shadowColor: '#00000059',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
  },
  dark: {
    small: {
      shadowColor: '#ffffff0d',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
    },
    medium: {
      shadowColor: '#ffffff1a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    large: {
      shadowColor: '#ffffff4d',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 1,
      shadowRadius: 20,
    },
  },
} as const

export const shadows = (isDark: boolean) => (isDark ? SHADOWS.dark : SHADOWS.light)
