import palette from './palette'

export const UI_COLORS = {
  accent: palette.accent,
  pro: palette.pro,
  success: palette.success,
  chevron: '#9ca3af',
  offline: '#9a3412',
  offlineDark: '#fdba74',
} as const

export const GRADIENTS = {
  cta: ['#2563eb', '#4f46e5', '#7c3aed'],
  pro: [palette.pro[600], palette.pro[700]],
  rewarded: [palette.accent[600], palette.accent[700]],
  success: [palette.success[700], palette.success[800]],
  onboardingStepLight: ['#f8faff', '#eef2ff', '#f5f3ff'],
  onboardingStepDark: ['#0f0c29', '#2b2659', '#24243e'],
} as const satisfies Record<string, readonly [string, string, ...string[]]>
