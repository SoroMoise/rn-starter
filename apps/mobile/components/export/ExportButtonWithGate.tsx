import { ExportGateSheet, type GateFeatureKey } from '@/components/export/ExportGateSheet'
import { ExportSplitButton } from '@/components/export/ExportSplitButton'
import type { DropdownOption } from '@/components/export/ExportSplitButton'
import React, { useState } from 'react'

type ExportButtonWithGateProps = {
  isPremium: boolean
  onExport: () => void
  loading?: boolean
  dropdownOptions?: DropdownOption[]
  mainGateKey: GateFeatureKey
  dropdownGateKeys?: GateFeatureKey[]
}

export function ExportButtonWithGate({
  isPremium,
  onExport,
  loading,
  dropdownOptions,
  mainGateKey,
  dropdownGateKeys,
}: ExportButtonWithGateProps) {
  const [gateVisible, setGateVisible] = useState(false)
  const [activeGateKey, setActiveGateKey] = useState<GateFeatureKey>(mainGateKey)

  const showGate = (key: GateFeatureKey) => {
    setActiveGateKey(key)
    setGateVisible(true)
  }

  if (isPremium) {
    return (
      <ExportSplitButton onExport={onExport} loading={loading} dropdownOptions={dropdownOptions} />
    )
  }

  const gatedDropdownOptions = dropdownOptions?.map((option, i) => ({
    ...option,
    onPress: () => showGate(dropdownGateKeys?.[i] ?? mainGateKey),
  }))

  return (
    <>
      <ExportSplitButton
        onExport={() => showGate(mainGateKey)}
        loading={loading}
        dropdownOptions={gatedDropdownOptions}
      />
      <ExportGateSheet
        visible={gateVisible}
        onClose={() => setGateVisible(false)}
        featureKey={activeGateKey}
      />
    </>
  )
}
