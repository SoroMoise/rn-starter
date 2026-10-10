const { withAppBuildGradle } = require('@expo/config-plugins')

// FORCE_FREE / FORCE_PRO and the consent test aids are a development build's. Shipped, a forced
// tier locks every subscriber out or gives Pro away, and the release workflow only ever saw
// MOBILE_DOTENV: a local `build:aab` or `build:install` read whatever the developer's .env held.
// Hooked on preReleaseBuild, so every release build refuses them before compiling anything —
// `bundleRelease`, `assembleRelease`, `expo run:android --variant release`, CI and EAS alike.
const MARKER = 'Release environment guard'

const GRADLE_BLOCK = `
// ${MARKER}
def releaseEnvCheck = tasks.register('checkReleaseEnv', Exec) {
    workingDir rootProject.file('..')
    commandLine 'node', 'scripts/check-release-env.js'
}

tasks.matching { it.name == 'preReleaseBuild' }.configureEach {
    dependsOn releaseEnvCheck
}
`

function withReleaseEnvGuard(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) return mod

    mod.modResults.contents += GRADLE_BLOCK
    return mod
  })
}

module.exports = withReleaseEnvGuard
