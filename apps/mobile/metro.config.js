const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)
config.resolver.sourceExts.push('cjs')

const NATIVE_PLATFORMS = new Set(['android', 'ios'])

// eslint-disable-next-line max-params -- the signature is Metro's
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (NATIVE_PLATFORMS.has(platform) && moduleName === '@revenuecat/purchases-js-hybrid-mappings') {
    return { type: 'empty' }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 15 })
