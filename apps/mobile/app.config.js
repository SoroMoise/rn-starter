const withAndroidConfigChanges = require('./plugins/withAndroidConfigChanges')
const withAndroidSigning = require('./plugins/withAndroidSigning')
const withBackupRules = require('./plugins/withBackupRules')
const withCrashlyticsMapping = require('./plugins/withCrashlyticsMapping')
const withGradleBuildCache = require('./plugins/withGradleBuildCache')
const withGradleMemory = require('./plugins/withGradleMemory')
const withAndroidFontFilter = require('./plugins/withAndroidFontFilter')

export default () => {
  const version = '1.0.0'

  const [major, minor, patch] = version.split('.').map(Number)

  // Play only ever accepts a strictly higher versionCode, so the formula must be
  // monotonic for every version this app will ever reach. Base 1000 per field
  // keeps 1.99.999 below 2.0.0; the older base-100 form overflowed as soon as a
  // minor or a patch hit 100 and made the next major a *lower* code, which Play
  // rejects with no way back but a hand-picked bump.
  const versionCode = major * 1000000 + minor * 1000 + patch

  return {
    expo: {
      name: 'RN Starter',
      slug: 'rn-starter',
      version,
      scheme: 'rnstarter',
      jsEngine: 'hermes',

      experiments: {
        tsconfigPaths: true,
      },

      orientation: 'portrait',
      icon: './assets/images/icon.png',

      // userInterfaceStyle: 'automatic', For IOS

      splash: {
        image: './assets/images/icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      assetBundlePatterns: ['assets/images/*'],
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.yourcompany.rnstarter',
        infoPlist: {
          NSUserTrackingUsageDescription:
            'This identifier will be used to deliver personalized ads to you.',
        },
        entitlements: {
          'aps-environment': 'production',
        },
      },
      android: {
        versionCode,
        package: 'com.yourcompany.rnstarter',
        googleServicesFile: './google-services.json',
        adaptiveIcon: {
          foregroundImage: './assets/images/icon.png',
          backgroundColor: '#ffffff',
        },
        permissions: ['android.permission.POST_NOTIFICATIONS'],
      },
      privacy: {
        privacyPolicyUrl: process.env.LEGAL_PRIVACY_POLICY_URL,
        termsOfServiceUrl: process.env.LEGAL_TERMS_OF_SERVICE_URL,
      },

      plugins: [
        withAndroidConfigChanges,
        withAndroidSigning,
        withBackupRules,
        withGradleMemory,
        withGradleBuildCache,
        withCrashlyticsMapping,
        withAndroidFontFilter,
        [
          'expo-build-properties',
          {
            android: {
              minSdkVersion: 26,
              enableProguardInReleaseBuilds: true,
              enableShrinkResourcesInReleaseBuilds: true,
            },
          },
        ],
        '@react-native-firebase/app',
        '@react-native-firebase/crashlytics',
        [
          'react-native-google-mobile-ads',
          {
            // Google's sample app ids: the SDK crashes at launch without one. Replace both with
            // the app's own before the first release — unit ids live in constants/admob.ts.
            androidAppId: 'ca-app-pub-3940256099942544~3347511713',
            iosAppId: 'ca-app-pub-3940256099942544~1458002511',
          },
        ],
        [
          'expo-notifications',
          {
            icon: './assets/notification-icon.png',
            color: '#f59e0b',
            defaultChannel: 'reminders',
            mode: 'production',
          },
        ],
      ],

      extra: {
        rtlRestartBannerEnabled: process.env.RTL_RESTART_BANNER_ENABLED !== 'false',
        backendUrl: process.env.BACKEND_URL,
        backendApiKey: process.env.BACKEND_API_KEY,
        websiteUrl: process.env.APP_WEBSITE_URL,
        legal: {
          privacyPolicyUrl: process.env.LEGAL_PRIVACY_POLICY_URL,
          termsOfServiceUrl: process.env.LEGAL_TERMS_OF_SERVICE_URL,
          licensesUrl: process.env.LEGAL_LICENSES_URL,
          supportEmail: process.env.LEGAL_SUPPORT_EMAIL,
        },
        purchases: {
          iosApiKey: process.env.REVENUECAT_IOS_API_KEY ?? '',
          androidApiKey: process.env.REVENUECAT_ANDROID_API_KEY ?? '',
          forceFree: process.env.FORCE_FREE === 'true',
          forcePro: process.env.FORCE_PRO === 'true',
          gracePeriodDays: parseInt(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS || '7', 10),
        },
      },
    },
  }
}
