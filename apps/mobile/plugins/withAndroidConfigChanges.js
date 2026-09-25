const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins')

// `smallestScreenSize` is missing from the Expo template while React Native's own
// manifest declares it. Without it, any resize that changes the smallest width —
// unfolding a foldable, multi-window, freeform mode, which Android 16 imposes
// above 600 dp — destroys and recreates MainActivity. If a native Modal is on
// screen at that moment, ReactModalHostView.dismiss() runs after WindowManager
// has already detached the dialog's DecorView and throws IllegalArgumentException.
// React Native only skips that dismiss when the activity `isFinishing`, which a
// destroy-without-finish is not, so the manifest is the only lever.
const REQUIRED_CONFIG_CHANGES = ['smallestScreenSize']

function withAndroidConfigChanges(config) {
  return withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults)
    const declared = (activity.$['android:configChanges'] ?? '').split('|').filter(Boolean)
    const missing = REQUIRED_CONFIG_CHANGES.filter((change) => !declared.includes(change))

    if (missing.length > 0) {
      activity.$['android:configChanges'] = [...declared, ...missing].join('|')
    }

    return config
  })
}

module.exports = withAndroidConfigChanges
