const withAndroidConfigChanges = require('./plugins/withAndroidConfigChanges')
const withAndroidSigning = require('./plugins/withAndroidSigning')
const withBackupRules = require('./plugins/withBackupRules')
const withCrashlyticsMapping = require('./plugins/withCrashlyticsMapping')
const withGradleBuildCache = require('./plugins/withGradleBuildCache')
const withGradleMemory = require('./plugins/withGradleMemory')
const withAndroidFontFilter = require('./plugins/withAndroidFontFilter')
const withReleaseEnvGuard = require('./plugins/withReleaseEnvGuard')

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
      // The icon, the splash image and the adaptive foreground are drawn by
      // scripts/generate-brand-assets.py, and the two background colours below match its BACKGROUND.
      icon: './assets/images/icon.png',

      // userInterfaceStyle: 'automatic', For IOS

      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#6366f1',
      },
      assetBundlePatterns: ['assets/images/*'],
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.yourcompany.rnstarter',
        // @react-native-firebase/app refuses an iOS prebuild without this path, or without the file.
        googleServicesFile: './GoogleService-Info.plist',
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
          foregroundImage: './assets/images/adaptive-icon.png',
          backgroundColor: '#6366f1',
        },
        permissions: ['android.permission.POST_NOTIFICATIONS'],
        // Every permission in the release manifest is listed on the store page and read by Play's
        // review. The Expo template declares these three and expo-file-system the two storage
        // ones again, so they are removed from the whole merge rather than from the template's
        // manifest alone; nothing here calls for any of them. A blocked permission fails at
        // runtime, never at build time: a feature that needs one takes it off this list in the same
        // change — a media picker needs READ_EXTERNAL_STORAGE up to Android 12, beside the
        // READ_MEDIA_* its library declares. Never block POST_NOTIFICATIONS or
        // RECEIVE_BOOT_COMPLETED: the notification system needs both (CLAUDE.md, Notifications).
        blockedPermissions: [
          'android.permission.SYSTEM_ALERT_WINDOW',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE',
        ],
      },
      // No `privacy` block: that key was expo.dev's project visibility, never a place for legal
      // URLs, and SDK 54's config schema no longer has it. The links the app opens are constants
      // (constants/legal.ts); the ones the stores show are entered in their consoles.

      plugins: [
        withAndroidConfigChanges,
        withAndroidSigning,
        withBackupRules,
        withGradleMemory,
        withGradleBuildCache,
        withCrashlyticsMapping,
        withAndroidFontFilter,
        withReleaseEnvGuard,
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
        consentDebug: {
          geography: process.env.UMP_DEBUG_GEOGRAPHY ?? '',
          testDeviceIds: process.env.UMP_TEST_DEVICE_IDS ?? '',
        },
        backendUrl: process.env.BACKEND_URL,
        backendApiKey: process.env.BACKEND_API_KEY,
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
