const { withAppBuildGradle } = require('@expo/config-plugins')

const MARKER = 'Crashlytics mapping upload'

const GRADLE_BLOCK = `
// ${MARKER}
plugins.withId('com.google.firebase.crashlytics') {
    android {
        buildTypes {
            debug {
                firebaseCrashlytics {
                    mappingFileUploadEnabled false
                }
            }
            release {
                firebaseCrashlytics {
                    mappingFileUploadEnabled System.getenv('CI') == 'true'
                }
            }
        }
    }
}
`

function withCrashlyticsMapping(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) return mod

    mod.modResults.contents += GRADLE_BLOCK
    return mod
  })
}

module.exports = withCrashlyticsMapping
