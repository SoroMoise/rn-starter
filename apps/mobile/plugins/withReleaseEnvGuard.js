const { withAppBuildGradle } = require('@expo/config-plugins')

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
