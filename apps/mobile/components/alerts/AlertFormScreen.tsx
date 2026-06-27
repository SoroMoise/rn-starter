import { CreateAlertForm } from '@/components/alerts/CreateAlertForm'
import { SheetBackButton } from '@/components/alerts/SheetBackButton'
import type { ScheduledAlert } from '@/stores/alertsStore'
import { View } from 'react-native'

type Props = {
  onBack: () => void
  onSuccess: () => void
  editingAlert?: ScheduledAlert
  formKey?: string
}

export function AlertFormScreen({ onBack, formKey, editingAlert, onSuccess }: Props) {
  return (
    <View className="flex-1">
      <SheetBackButton onPress={onBack} />
      <CreateAlertForm key={formKey} editingAlert={editingAlert} onSuccess={onSuccess} />
    </View>
  )
}
