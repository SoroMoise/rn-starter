const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)
config.resolver.sourceExts.push('cjs')

// react-native-purchases requires its browser implementation at import, whatever the platform, and
// only calls into it without a native module (Expo Go, web). A native build always ships
// RNPurchases, so on Android and iOS the web SDK is ~740 KB of the bundle nothing runs — the
// largest package in it. Resolved to an empty module there, and only there: web keeps the real
// one, its only purchase path, and so does any request Metro makes without a platform. Expo Go
// loses browser mode with it — MMKV, Firebase and AdMob already keep the app out of Expo Go.
const NATIVE_PLATFORMS = new Set(['android', 'ios'])

// eslint-disable-next-line max-params -- the signature is Metro's
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (NATIVE_PLATFORMS.has(platform) && moduleName === '@revenuecat/purchases-js-hybrid-mappings') {
    return { type: 'empty' }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })
