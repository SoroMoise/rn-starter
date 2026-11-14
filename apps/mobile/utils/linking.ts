import { Alert, Linking } from 'react-native'
import { triggerError } from './haptics'

export type OpenExternalLinkParams = {
  url: string
  errorTitle?: string
  errorMessage?: string
}

// Linking.canOpenURL is never the gate: package visibility (Android 11+) hides the mail apps from its
// query unless the manifest lists mailto, while openURL starts the intent regardless.
export const openExternalLink = async ({
  url,
  errorTitle,
  errorMessage,
}: OpenExternalLinkParams) => {
  try {
    await Linking.openURL(url)
  } catch (error: unknown) {
    triggerError()
    const message =
      error instanceof Error ? error.message : 'Failed to open link. Please try again later.'
    Alert.alert(errorTitle || 'Error', errorMessage || message, undefined, { cancelable: true })
  }
}
