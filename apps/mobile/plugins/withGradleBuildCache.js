const { withGradleProperties } = require('@expo/config-plugins')

function withGradleBuildCache(config) {
  return withGradleProperties(config, (mod) => {
    const caching = mod.modResults.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.caching'
    )

    if (caching) {
      caching.value = 'true'
      return mod
    }

    mod.modResults.push(
      { type: 'empty' },
      {
        type: 'comment',
        value: 'Native library builds (reanimated, worklets, mmkv, screens, gesture-handler)',
      },
      {
        type: 'comment',
        value: 'have stable inputs release to release, so their compiled output is a legitimate',
      },
      { type: 'comment', value: 'cache hit across CI runs once ~/.gradle is restored.' },
      { type: 'property', key: 'org.gradle.caching', value: 'true' }
    )

    return mod
  })
}

module.exports = withGradleBuildCache
