const fs = require('fs')
const path = require('path')
const { withAppBuildGradle } = require('@expo/config-plugins')

// Strips the @expo/vector-icons fonts the app does not use from the Android build. Metro ships the
// font of every family a module imports, and an import from the package index imports all fifteen:
// nineteen files, 4 MB, where Ionicons alone is 384 KB. They reach the build from three places,
// and all three are cleaned because mergeReleaseResources aggregates them:
// 1. createBundleReleaseJsAndAssets → generated/res/.../raw/ (the Metro task)
// 2. mergeReleaseResources → merged-not-compiled-resources/.../raw/
// 3. packageReleaseResources → packaged_res/.../raw/ (AAB only)
//
// The list is written by hand rather than inferred from the imports, since a family can be drawn
// by a dependency the app never imports. The guard below refuses the prebuild instead when a
// family the app imports is missing from it: without the guard, the omission only shows in a
// release build, as empty squares where the icons should be.
const KEEP_FONTS = ['Ionicons']

// The block is replaced at every prebuild rather than skipped once present: a prebuild without
// --clean re-runs this on the existing build.gradle, and a family added to KEEP_FONTS after the
// guard asked for it must reach the build then.
const BLOCK_BEGIN = '// @generated begin withAndroidFontFilter'
const BLOCK_END = '// @generated end withAndroidFontFilter'
const GENERATED_BLOCK = new RegExp(`\\n?${BLOCK_BEGIN}[\\s\\S]*?${BLOCK_END}\\n?`)

// A family is a module of @expo/vector-icons that requires a font file, and some require several:
// FontAwesome5 draws from FontAwesome5_Regular, _Solid and _Brands. Read off the package itself,
// so a kept family keeps every file it loads.
function readFamilyFonts(projectRoot) {
  const packageJson = require.resolve('@expo/vector-icons/package.json', { paths: [projectRoot] })
  const buildDirectory = path.join(path.dirname(packageJson), 'build')
  const families = new Map()

  for (const entry of fs.readdirSync(buildDirectory)) {
    if (path.extname(entry) !== '.js') continue
    const source = fs.readFileSync(path.join(buildDirectory, entry), 'utf8')
    const fonts = [...source.matchAll(/Fonts\/([A-Za-z0-9_]+)\.ttf/g)].map(([, font]) => font)
    if (fonts.length > 0) families.set(path.basename(entry, '.js'), [...new Set(fonts)])
  }

  return families
}

// Metro names an Android resource after the asset's path, lowercased with every character outside
// [a-z0-9_] dropped (@react-native/assets-registry): …_fonts_fontawesome5_solid.ttf. Anchoring on
// `_<file>.ttf` keeps a kept family from sparing a neighbour whose name contains its own.
function keptSuffixes(families) {
  return KEEP_FONTS.flatMap((family) => {
    const fonts = families.get(family)
    if (!fonts) {
      throw new Error(
        `withAndroidFontFilter: KEEP_FONTS names "${family}", which is not an @expo/vector-icons family. Known families: ${[...families.keys()].join(', ')}.`
      )
    }
    return fonts.map((font) => `_${font.toLowerCase().replace(/[^a-z0-9_]/g, '')}.ttf`)
  })
}

const gradleTask = (suffixes) => `
${BLOCK_BEGIN}
afterEvaluate {
    def keepSuffixes = ${JSON.stringify(suffixes)}

    def deleteUnusedFonts = { File dir ->
        if (!dir.exists()) return
        dir.eachFileRecurse { f ->
            if (!f.isFile()) return
            def isVectorFont = f.name.contains("reactnativevectoricons") || f.name.contains("expo_vectoricons")
            def isKept = keepSuffixes.any { suffix -> f.name.contains(suffix) }
            if (isVectorFont && !isKept) {
                println("Removed unused font: \${f.name}")
                f.delete()
            }
        }
    }

    tasks.matching { it.name == "createBundleReleaseJsAndAssets" || it.name == "createBundleDebugJsAndAssets" }.configureEach {
        doLast {
            deleteUnusedFonts(file("\${buildDir}/generated/res"))
        }
    }

    tasks.matching { it.name == "mergeReleaseResources" || it.name == "mergeDebugResources" }.configureEach {
        doLast {
            def variant = name.replace("merge", "").replace("Resources", "").toLowerCase()
            deleteUnusedFonts(file("\${buildDir}/intermediates/merged-not-compiled-resources/\${variant}"))
            deleteUnusedFonts(file("\${buildDir}/intermediates/merged_res/\${variant}"))
        }
    }

    tasks.matching { it.name == "packageReleaseResources" || it.name == "packageDebugResources" }.configureEach {
        doLast {
            def variant = name.replace("package", "").replace("Resources", "").toLowerCase()
            deleteUnusedFonts(file("\${buildDir}/intermediates/packaged_res/\${variant}"))
        }
    }
}
${BLOCK_END}
`

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx'])
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'android',
  'ios',
  '.git',
  '.expo',
  'dist',
  'build',
])

// One import or export statement from @expo/vector-icons: `type`, the bindings, the subpath. The
// bindings cannot contain a quote, which keeps a match from reaching back into the statement
// before it — the code has no semicolons to stop at.
const ICON_IMPORT =
  /\b(?:import|export)\s+(type\s+)?([^'"`;]*?)\s*from\s*['"]@expo\/vector-icons(?:\/([A-Za-z0-9_]+))?['"]/g
// A require() or a dynamic import(): Metro bundles the family either way.
const ICON_CALL = /\b(?:require|import)\(\s*['"]@expo\/vector-icons\/([A-Za-z0-9_]+)['"]\s*\)/g

// A commented-out import or an example in a doc comment draws nothing. `//` after a colon is a
// URL inside a string, not a comment.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

function collectSourceFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        collectSourceFiles(path.join(directory, entry.name), files)
      }
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.join(directory, entry.name))
    }
  }
  return files
}

// A type-only import ships no font, and a name that is not a family — createIconSet, a build/
// path — draws nothing.
function collectImportedFamilies({ projectRoot, families }) {
  const imported = new Set()

  for (const file of collectSourceFiles(projectRoot)) {
    const source = fs.readFileSync(file, 'utf8')
    if (!source.includes('@expo/vector-icons')) continue
    const contents = stripComments(source)

    for (const [, typeOnly, bindings, subpath] of contents.matchAll(ICON_IMPORT)) {
      if (typeOnly) continue
      if (subpath) {
        imported.add(subpath)
        continue
      }
      const named = bindings.match(/\{([^}]*)\}/)
      if (!named) continue
      for (const binding of named[1].split(',')) {
        const name = binding.trim()
        if (!name || name.startsWith('type ')) continue
        imported.add(name.split(/\s+as\s+/)[0].trim())
      }
    }
    for (const [, subpath] of contents.matchAll(ICON_CALL)) {
      imported.add(subpath)
    }
  }

  return [...imported].filter((name) => families.has(name))
}

function assertKeepListCoversImports({ projectRoot, families }) {
  const missing = collectImportedFamilies({ projectRoot, families }).filter(
    (family) => !KEEP_FONTS.includes(family)
  )
  if (missing.length === 0) return

  throw new Error(
    `withAndroidFontFilter: ${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} imported from @expo/vector-icons but missing from KEEP_FONTS, so the build would strip ${missing.length > 1 ? 'their fonts' : 'its font'} and the icons would render as empty squares. Add ${missing.length > 1 ? 'them' : 'it'} to KEEP_FONTS in plugins/withAndroidFontFilter.js.`
  )
}

function withAndroidFontFilter(config) {
  return withAppBuildGradle(config, (mod) => {
    const { projectRoot } = mod.modRequest
    const families = readFamilyFonts(projectRoot)
    const suffixes = keptSuffixes(families)
    assertKeepListCoversImports({ projectRoot, families })

    mod.modResults.contents =
      mod.modResults.contents.replace(GENERATED_BLOCK, '') + gradleTask(suffixes)
    return mod
  })
}

module.exports = withAndroidFontFilter
