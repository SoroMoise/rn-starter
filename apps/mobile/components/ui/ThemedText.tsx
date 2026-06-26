import { Text, type TextProps } from 'react-native'

const VARIANT_CLASSES = {
  display: 'text-4xl font-extrabold tracking-tight',
  title: 'text-2xl font-bold',
  heading: 'text-lg font-bold',
  subheading: 'text-base font-semibold',
  body: 'text-base',
  label: 'text-sm font-medium',
  caption: 'text-xs',
  sectionHeader: 'text-xs font-semibold uppercase tracking-wider',
  buttonLarge: 'text-lg font-bold',
  button: 'text-base font-semibold',
  inherit: 'text-inherit',
} as const

const COLOR_CLASSES = {
  default: 'text-gray-900 dark:text-white',
  muted: 'text-gray-500 dark:text-gray-400',
  subtle: 'text-gray-400 dark:text-gray-500',
  dimmed: 'text-gray-600 dark:text-gray-200',
  primary: 'text-blue-500 dark:text-blue-400',
  error: 'text-red-500 dark:text-red-400',
  success: 'text-emerald-500 dark:text-emerald-400',
  warning: 'text-orange-500 dark:text-orange-400',
  inverse: 'text-white',
  inherit: '',
} as const

const WEIGHT_CLASSES = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
} as const

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

type Variant = keyof typeof VARIANT_CLASSES
type Color = keyof typeof COLOR_CLASSES
type Weight = keyof typeof WEIGHT_CLASSES
type Align = keyof typeof ALIGN_CLASSES

export interface Props extends TextProps {
  variant?: Variant
  color?: Color
  weight?: Weight
  align?: Align
  className?: string
}

export function ThemedText({
  variant = 'body',
  color = 'default',
  weight,
  align,
  className,
  ...textProps
}: Props) {
  const variantClass = VARIANT_CLASSES[variant]
  const colorClass = COLOR_CLASSES[color]
  const weightClass = weight ? WEIGHT_CLASSES[weight] : ''
  const alignClass = align ? ALIGN_CLASSES[align] : ''

  const combinedClassName =
    `${variantClass} ${colorClass} ${weightClass} ${alignClass} ${className ?? ''}`.trim()

  return <Text className={combinedClassName} {...textProps} />
}
