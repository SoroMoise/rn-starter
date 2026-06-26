import { CreateAlertForm } from '@/components/alerts/CreateAlertForm'
import { SheetBackButton } from '@/components/alerts/SheetBackButton'
import type { RateAlert } from '@/types'
import { View } from 'react-native'

type Props = {
  fromCurrency: string
  toCurrency: string
  onBack: () => void
  onSuccess: () => void
  editingAlert?: RateAlert
  editablePair?: boolean
  onFromPress?: () => void
  onToPress?: () => void
  onSwap?: () => void
  formKey?: string
}

export function AlertFormScreen({ onBack, formKey, ...formProps }: Props) {
  return (
    <View className="flex-1">
      <SheetBackButton onPress={onBack} />
      <CreateAlertForm key={formKey} {...formProps} />
    </View>
  )
}
