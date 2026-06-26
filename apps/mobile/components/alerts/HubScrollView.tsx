import { ModalBottomSheetScrollView } from '@/components/ui/ModalBottomSheet'

export function HubScrollView({ children }: { children: React.ReactNode }) {
  return (
    <ModalBottomSheetScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
      {children}
    </ModalBottomSheetScrollView>
  )
}
