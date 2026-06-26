import { STORE_URLS } from '@/constants/legal'
import { Alert, Linking, Platform } from 'react-native'
import { triggerError } from './haptics'

export type OpenExternalLinkParams = {
  url: string
  errorTitle?: string
  errorMessage?: string
}

export const openExternalLink = async ({
  url,
  errorTitle,
  errorMessage,
}: OpenExternalLinkParams) => {
  try {
    const canOpen = await Linking.canOpenURL(url)

    if (canOpen) {
      await Linking.openURL(url)
      return
    }

    triggerError()
    Alert.alert(
      errorTitle || 'Error',
      errorMessage || 'Cannot open this link on your device.',
      undefined,
      { cancelable: true }
    )
  } catch (error: unknown) {
    triggerError()
    const message =
      error instanceof Error ? error.message : 'Failed to open link. Please try again later.'
    Alert.alert(errorTitle || 'Error', errorMessage || message, undefined, { cancelable: true })
  }
}

export const openStoreRating = async () => {
  const storeUrl = Platform.OS === 'ios' ? STORE_URLS.IOS : STORE_URLS.ANDROID
  await openExternalLink({
    url: storeUrl,
    errorTitle: 'Error',
    errorMessage: 'Cannot open store on your device.',
  })
}
