import palette from './palette'

// Raw values for props that cannot consume Tailwind classes (icon `color`). The roles are the
// scales of `palette.js`, which tailwind.config.js reads too; the others copy Tailwind's own palette.
export const UI_COLORS = {
  accent: palette.accent,
  pro: palette.pro,
  success: palette.success,
  chevron: '#9ca3af',
  offline: '#9a3412',
  offlineDark: '#fdba74',
} as const

// Named by role, never by hue. The tuple is what expo-linear-gradient requires — a one-colour
// token fails the build instead of rendering a flat block.
export const GRADIENTS = {
  cta: ['#3b82f6', '#6366f1', '#8b5cf6'],
  pro: [palette.pro[600], palette.pro[700]],
  rewarded: [palette.accent[500], palette.accent[400]],
  success: [palette.success[500], palette.success[600]],
  onboardingStepLight: ['#f8faff', '#eef2ff', '#f5f3ff'],
  onboardingStepDark: ['#0f0c29', '#302b63', '#24243e'],
} as const satisfies Record<string, readonly [string, string, ...string[]]>
