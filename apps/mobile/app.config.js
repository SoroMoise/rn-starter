const withAndroidFontFilter = require('./plugins/withAndroidFontFilter')

export default () => {
  const version = '1.0.0'

  const [major, minor, patch] = version.split('.').map(Number)

  const versionCode = major * 10000 + minor * 100 + patch

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
        '@react-native-google-signin/google-signin',
        [
          'react-native-google-mobile-ads',
          {
            androidAppId: process.env.ADMOB_ANDROID_APP_ID,
            iosAppId: process.env.ADMOB_IOS_APP_ID,
          },
        ],
        [
          'expo-notifications',
          {
            icon: './assets/notification-icon.png',
            color: '#f59e0b',
            defaultChannel: 'reminders',
            mode: 'production',
            enableBackgroundRemoteNotifications: true,
          },
        ],
      ],

      extra: {
        rtlRestartBannerEnabled: process.env.RTL_RESTART_BANNER_ENABLED !== 'false',
        backendUrl: process.env.BACKEND_URL,
        backendApiKey: process.env.BACKEND_API_KEY,
        websiteUrl: process.env.APP_WEBSITE_URL,
        googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
        legal: {
          privacyPolicyUrl: process.env.LEGAL_PRIVACY_POLICY_URL,
          termsOfServiceUrl: process.env.LEGAL_TERMS_OF_SERVICE_URL,
          licensesUrl: process.env.LEGAL_LICENSES_URL,
          supportEmail: process.env.LEGAL_SUPPORT_EMAIL,
        },
        store: {
          ios: process.env.STORE_URL_IOS,
          android: process.env.STORE_URL_ANDROID,
        },
        admob: {
          bannerIndexEnabled: process.env.AD_BANNER_INDEX_ENABLED !== 'false',
          bannerStatisticsEnabled: process.env.AD_BANNER_STATISTICS_ENABLED !== 'false',
          bannerSettingsEnabled: process.env.AD_BANNER_SETTINGS_ENABLED !== 'false',
          interstitialEnabled: process.env.AD_INTERSTITIAL_ENABLED !== 'false',
          rewardedEnabled: process.env.AD_REWARDED_ENABLED !== 'false',
          rewardedFreeDurationMinutes: parseInt(
            process.env.AD_REWARDED_FREE_DURATION_MINUTES || '60',
            10
          ),
          androidBannerIndexId: process.env.ADMOB_ANDROID_BANNER_INDEX_ID,
          androidBannerStatisticsId: process.env.ADMOB_ANDROID_BANNER_STATISTICS_ID,
          androidBannerSettingsId: process.env.ADMOB_ANDROID_BANNER_SETTINGS_ID,
          androidInterstitialId: process.env.ADMOB_ANDROID_INTERSTITIAL_ID,
          androidRewardedId: process.env.ADMOB_ANDROID_REWARDED_ID,
          iosBannerIndexId: process.env.ADMOB_IOS_BANNER_INDEX_ID,
          iosBannerStatisticsId: process.env.ADMOB_IOS_BANNER_STATISTICS_ID,
          iosBannerSettingsId: process.env.ADMOB_IOS_BANNER_SETTINGS_ID,
          iosInterstitialId: process.env.ADMOB_IOS_INTERSTITIAL_ID,
          iosRewardedId: process.env.ADMOB_IOS_REWARDED_ID,
        },
        purchases: {
          iosApiKey: process.env.REVENUECAT_IOS_API_KEY ?? '',
          androidApiKey: process.env.REVENUECAT_ANDROID_API_KEY ?? '',
          forceFree: process.env.FORCE_FREE === 'true',
          gracePeriodDays: parseInt(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS || '7', 10),
        },
      },
    },
  }
}
