const { withGradleProperties } = require('@expo/config-plugins')

// Play serves x86 and x86_64 to almost no device (Chromebooks run the ARM build), and
// each ABI is a full native compile on the CI runner. A debug `expo run:android` still
// builds for the connected device's ABI.
const ARCHITECTURES = 'armeabi-v7a,arm64-v8a'

function withReleaseAbis(config) {
  return withGradleProperties(config, (mod) => {
    const architectures = mod.modResults.find(
      (item) => item.type === 'property' && item.key === 'reactNativeArchitectures'
    )

    if (architectures) {
      architectures.value = ARCHITECTURES
    } else {
      mod.modResults.push({
        type: 'property',
        key: 'reactNativeArchitectures',
        value: ARCHITECTURES,
      })
    }

    return mod
  })
}

module.exports = withReleaseAbis
