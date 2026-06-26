const { withAppBuildGradle } = require('@expo/config-plugins')

// Supprime les fonts @expo/vector-icons inutilisées du build Android.
// Les fonts proviennent de trois sources distinctes :
// 1. createBundleReleaseJsAndAssets → generated/res/.../raw/ (tâche Metro)
// 2. mergeReleaseResources → merged-not-compiled-resources/.../raw/
// 3. packageReleaseResources → packaged_res/.../raw/ (spécifique AAB)
// Les trois doivent être nettoyées car mergeReleaseResources agrège les trois.
const KEEP_FONTS = ['ionicons']

const GRADLE_TASK = `
// Suppression des fonts @expo/vector-icons inutilisées
afterEvaluate {
    def keepFonts = ${JSON.stringify(KEEP_FONTS)}

    def deleteUnusedFonts = { File dir ->
        if (!dir.exists()) return
        dir.eachFileRecurse { f ->
            if (!f.isFile()) return
            def isVectorFont = f.name.contains("reactnativevectoricons") || f.name.contains("expo_vectoricons")
            def isKept = keepFonts.any { fname -> f.name.contains(fname) }
            if (isVectorFont && !isKept) {
                println("Font supprimée (inutilisée): \${f.name}")
                f.delete()
            }
        }
    }

    // Source 1 : tâche Metro (génère les assets JS + fonts dans generated/res/)
    tasks.matching { it.name == "createBundleReleaseJsAndAssets" || it.name == "createBundleDebugJsAndAssets" }.configureEach {
        doLast {
            deleteUnusedFonts(file("\${buildDir}/generated/res"))
        }
    }

    // Source 2 : fusion des ressources (APK et AAB)
    tasks.matching { it.name == "mergeReleaseResources" || it.name == "mergeDebugResources" }.configureEach {
        doLast {
            def variant = name.replace("merge", "").replace("Resources", "").toLowerCase()
            deleteUnusedFonts(file("\${buildDir}/intermediates/merged-not-compiled-resources/\${variant}"))
            deleteUnusedFonts(file("\${buildDir}/intermediates/merged_res/\${variant}"))
        }
    }

    // Source 3 : ressources packagées pour l'AAB
    tasks.matching { it.name == "packageReleaseResources" || it.name == "packageDebugResources" }.configureEach {
        doLast {
            def variant = name.replace("package", "").replace("Resources", "").toLowerCase()
            deleteUnusedFonts(file("\${buildDir}/intermediates/packaged_res/\${variant}"))
        }
    }
}
`

function withAndroidFontFilter(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('Suppression des fonts')) {
      return config
    }
    config.modResults.contents += GRADLE_TASK
    return config
  })
}

module.exports = withAndroidFontFilter
