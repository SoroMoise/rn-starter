import { STORE_URLS } from '@/constants/legal'
import { PLAY_STORE_RATE_URL } from '@/constants/rating'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import * as StoreReview from 'expo-store-review'
import { Linking, Platform } from 'react-native'

const STORE_URL = Platform.OS === 'ios' ? STORE_URLS.IOS : PLAY_STORE_RATE_URL

/**
 * Attempts native in-app review first.
 * Falls back to the platform-appropriate store URL if native review is unavailable.
 * Silently fails if both attempts fail.
 */
export async function requestStoreReview(): Promise<void> {
  try {
    // this will be uncomment. i left it out for now because the native review dialog is currently causing crashes on Android, and we want to be able to deploy a fix without needing to update the app. once we have more confidence in the stability of the native review flow, we can uncomment this and remove the fallback to the store URL.
    // const isAvailable = (await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())

    const isAvailable = false

    if (isAvailable) {
      await StoreReview.requestReview()
      analyticsService.track('store_review_native_requested')
      return
    }

    if (STORE_URL) {
      await Linking.openURL(STORE_URL)
      analyticsService.track('store_review_store_opened', { reason: 'unavailable' })
    }
  } catch (error) {
    crashlyticsService.recordError(error as Error, { reason: 'requestStoreReview' })

    try {
      if (STORE_URL) {
        await Linking.openURL(STORE_URL)
        analyticsService.track('store_review_store_opened', { reason: 'error_fallback' })
      }
    } catch (fallbackError) {
      crashlyticsService.recordError(fallbackError as Error, {
        reason: 'requestStoreReview.fallback',
      })
    }
  }
}
