const { withProjectBuildGradle } = require('@expo/config-plugins')

const RESOLUTION_BLOCK = `
  // Migrate from deprecated monolithic play:core to split libraries (required for targetSdk 34+)
  // Fixes PlayCoreDialogWrapperActivity NPE crash on null bundle
  configurations.all {
    resolutionStrategy.eachDependency { details ->
      if (details.requested.group == 'com.google.android.play' && details.requested.name == 'core') {
        details.useVersion '1.10.3'
        details.because 'Monolithic play:core deprecated; pinning last stable version until full split-library migration'
      }
    }
  }`

module.exports = (config) =>
  withProjectBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('com.google.android.play:core:1.10.3')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /allprojects \{(\s*repositories \{)/,
        `allprojects {${RESOLUTION_BLOCK}\n$1`
      )
    }
    return mod
  })
