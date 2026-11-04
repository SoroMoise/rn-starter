const withAndroidConfigChanges = require('./plugins/withAndroidConfigChanges')
const withAndroidSigning = require('./plugins/withAndroidSigning')
const withBackupRules = require('./plugins/withBackupRules')
const withCrashlyticsMapping = require('./plugins/withCrashlyticsMapping')
const withGradleBuildCache = require('./plugins/withGradleBuildCache')
const withGradleMemory = require('./plugins/withGradleMemory')
const withLintVitalOff = require('./plugins/withLintVitalOff')
const withReleaseAbis = require('./plugins/withReleaseAbis')
const withAndroidFontFilter = require('./plugins/withAndroidFontFilter')
const withReleaseEnvGuard = require('./plugins/withReleaseEnvGuard')

export default () => {
  const version = '1.0.0'

  const [major, minor, patch] = version.split('.').map(Number)

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

      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#6366f1',
      },
      assetBundlePatterns: ['assets/images/*'],
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.yourcompany.rnstarter',
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
        // change: a media picker needs READ_EXTERNAL_STORAGE up to Android 12, beside the
        // READ_MEDIA_* its library declares. Never block POST_NOTIFICATIONS or
        // RECEIVE_BOOT_COMPLETED: the notification system needs both (CLAUDE.md, Notifications).
        blockedPermissions: [
          'android.permission.SYSTEM_ALERT_WINDOW',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE',
        ],
      },

      plugins: [
        withAndroidConfigChanges,
        withAndroidSigning,
        withBackupRules,
        withGradleMemory,
        withGradleBuildCache,
        withReleaseAbis,
        withLintVitalOff,
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
            // the app's own before the first release; unit ids live in constants/admob.ts.
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
        },
      },
    },
  }
}
