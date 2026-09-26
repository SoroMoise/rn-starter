// Raw values for props that cannot consume Tailwind classes (icon `color`).
// Keep in sync with tailwind.config.js theme.extend.colors.
export const UI_COLORS = {
  brand: '#8b5cf6',
  brandBlue: '#3b82f6',
  brandGreen: '#10b981',
  chevron: '#9ca3af',
} as const

// Named by role, never by hue: a rebrand edits the values here and every name stays true. The
// tuple is what expo-linear-gradient requires — a one-colour token fails the build instead of
// rendering a flat block.
export const GRADIENTS = {
  cta: ['#3b82f6', '#6366f1', '#8b5cf6'],
  pro: ['#7c3aed', '#6d28d9'],
  onboardingStepLight: ['#f8faff', '#eef2ff', '#f5f3ff'],
  onboardingStepDark: ['#0f0c29', '#302b63', '#24243e'],
} as const satisfies Record<string, readonly [string, string, ...string[]]>
