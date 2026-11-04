const { withAppBuildGradle } = require('@expo/config-plugins')

const LINT_BLOCK = `    lint {
        checkReleaseBuilds false
    }

`

// A release bundle otherwise runs lintVitalAnalyzeRelease on every library module,
// several minutes on the 2-core CI runner, for a report nothing reads.
function withLintVitalOff(config) {
  return withAppBuildGradle(config, (mod) => {
    const { contents } = mod.modResults
    if (contents.includes('checkReleaseBuilds')) return mod
    if (!/^android \{\n/m.test(contents)) {
      throw new Error('withLintVitalOff: no `android {` block in app/build.gradle')
    }
    mod.modResults.contents = contents.replace(/^android \{\n/m, (match) => match + LINT_BLOCK)
    return mod
  })
}

module.exports = withLintVitalOff
