const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)
config.resolver.sourceExts.push('cjs')

// react-native-purchases requires its browser implementation at import, whatever the platform, and
// only calls into it without a native module (Expo Go, web). A native build always ships
// RNPurchases, so on Android and iOS the web SDK is ~740 KB of the bundle nothing runs — the
// largest package in it. Resolved to an empty module there; web keeps the real one, which is its
// only purchase path. Expo Go loses browser mode with it — MMKV, Firebase and AdMob already keep
// the app out of Expo Go.
// eslint-disable-next-line max-params -- the signature is Metro's
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && moduleName === '@revenuecat/purchases-js-hybrid-mappings') {
    return { type: 'empty' }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css' })
