const { withAppBuildGradle } = require('@expo/config-plugins')

// Upload the R8 mapping only from CI. A minified release whose mapping never reached Crashlytics
// reports every frame as `a.b.c(SourceFile:1)`; a local `bundleRelease` has no business
// overwriting the mapping of the release that is actually live. Force one locally with
// `CI=true ./gradlew bundleRelease`.
//
// Wrapped in `plugins.withId` rather than written into the top-level `android { }` block: the
// @react-native-firebase/crashlytics config plugin appends its `apply plugin:` at the *end* of
// app/build.gradle, so the firebaseCrashlytics DSL does not exist yet when Gradle evaluates the
// initial android block — putting it there fails configuration for every variant.
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
