import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import Constants from 'expo-constants'

const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

const appConfig = Constants.expoConfig?.extra as Record<string, unknown> | undefined
const WEB_CLIENT_ID = (appConfig?.googleWebClientId as string | undefined) ?? ''

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  scopes: [DRIVE_APPDATA_SCOPE],
})

export const googleAuthService = {
  async signIn(): Promise<{ email: string } | null> {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      const response = await GoogleSignin.signIn()
      if (response.type === 'success') {
        return { email: response.data.user.email }
      }
      return null
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === statusCodes.SIGN_IN_CANCELLED
      ) {
        return null
      }
      throw error
    }
  },

  async signInSilently(): Promise<{ email: string } | null> {
    try {
      const response = await GoogleSignin.signInSilently()
      if (response.type === 'success') {
        return { email: response.data.user.email }
      }
      return null
    } catch {
      return null
    }
  },

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut()
    } catch {
      /* silent */
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await GoogleSignin.getTokens()
      return tokens.accessToken
    } catch {
      return null
    }
  },

  async isSignedIn(): Promise<boolean> {
    try {
      return GoogleSignin.hasPreviousSignIn()
    } catch {
      return false
    }
  },
}
