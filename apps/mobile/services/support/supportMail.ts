import Constants from 'expo-constants'
import { Platform } from 'react-native'

export type SupportDiagnostics = {
  appName: string
  appVersion: string
  system: string
  deviceModel: string | null
  language: string
}

export type BuildSupportMailtoParams = {
  mailtoUrl: string
  subject: string
  firstLine: string
  diagnostics: SupportDiagnostics
}

const UNKNOWN = 'unknown'

const readSystem = (): string => {
  if (Platform.OS !== 'android') return `${Platform.OS} ${Platform.Version}`
  const release = (Platform.constants as { Release?: string }).Release?.trim()
  return release
    ? `Android ${release} (API ${Platform.Version})`
    : `Android API ${Platform.Version}`
}

export const readSupportDiagnostics = ({ language }: { language: string }): SupportDiagnostics => {
  const model =
    Platform.OS === 'android' ? (Platform.constants as { Model?: string }).Model?.trim() : undefined
  return {
    appName: Constants.expoConfig?.name ?? UNKNOWN,
    appVersion: Constants.expoConfig?.version ?? UNKNOWN,
    system: readSystem(),
    deviceModel: model ? model : null,
    language,
  }
}

export const buildSupportMailto = ({
  mailtoUrl,
  subject,
  firstLine,
  diagnostics,
}: BuildSupportMailtoParams): string => {
  const lines = [
    firstLine,
    '',
    '',
    '---',
    `App: ${diagnostics.appName} ${diagnostics.appVersion}`,
    `System: ${diagnostics.system}`,
    ...(diagnostics.deviceModel ? [`Device: ${diagnostics.deviceModel}`] : []),
    `Language: ${diagnostics.language}`,
  ]
  return `${mailtoUrl}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    lines.join('\n')
  )}`
}
