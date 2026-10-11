#!/usr/bin/env node
/**
 * Writes apps/mobile/constants/licences.generated.json, the list the app's licences screen shows
 * (Settings › Legal & support › Open-source licences). Never edit that file by hand: run this.
 *
 *   node scripts/generate-licences.mjs              JS, native C/C++ and fonts; keeps the Android list
 *   node scripts/generate-licences.mjs --android    the same, plus Gradle's release runtime classpath
 *   node scripts/generate-licences.mjs --fetch      also downloads the texts it lacks
 *
 * Options:
 *   --sourcemap <file>        read the bundle's packages from this source map instead of exporting one
 *   --android-report <file>   read the Gradle list from this report instead of running Gradle
 *
 * Sources, and the rules CLAUDE.md (Legal links) gives them:
 * - App libraries: the npm packages in the Android JS bundle (the sources of `expo export`'s source
 *   map, never a licence checker over the node_modules apps/web shares) and the autolinked ones.
 * - Native libraries: what React Native and MMKV compile into their .so files, and every library
 *   vendored under a local module's `third_party/<lib>/`, read off its NOTICE.md.
 * - Fonts: every family under apps/mobile/assets/fonts, read off the licence text beside it, and
 *   every @expo/vector-icons family withAndroidFontFilter keeps.
 * - Android libraries (--android): every Maven artifact of `:app:releaseRuntimeClasspath`, with the
 *   licences its POM declares, through scripts/licences/android-licences.init.gradle.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MOBILE = path.join(ROOT, 'apps/mobile')
const OUTPUT = path.join(MOBILE, 'constants/licences.generated.json')
const DATA = path.join(ROOT, 'scripts/licences')
const TEXTS = path.join(DATA, 'texts')
const TEXT_MANIFEST = path.join(TEXTS, 'sources.json')
const INIT_SCRIPT = path.join(DATA, 'android-licences.init.gradle')
const IN_HOUSE_MODULES = path.join(MOBILE, 'modules')
const FONTS = path.join(MOBILE, 'assets/fonts')
const RN = path.join(ROOT, 'node_modules/react-native')

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

const warnings = []
const warn = (message) => {
  warnings.push(message)
  console.warn(`warning: ${message}`)
}

const read = (file) => fs.readFileSync(file, 'utf8')
const normalise = (text) =>
  text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\s+$/, '')
const relative = (file) => path.relative(ROOT, file)

const SPDX_URL = (id) =>
  `https://raw.githubusercontent.com/spdx/license-list-data/main/text/${id}.txt`
const SPDX_IDS = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'BSL-1.0']

function rnCatalogVersion(key) {
  const catalog = read(path.join(RN, 'gradle/libs.versions.toml'))
  const match = catalog.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, 'm'))
  if (!match) throw new Error(`react-native's libs.versions.toml has no "${key}"`)
  return match[1]
}

function hermesRef() {
  const tag = read(path.join(RN, 'sdks/.hermesversion')).trim()
  return { tag, commit: tag.match(/([0-9a-f]{40})$/)?.[1] ?? tag }
}

function mmkvCoreVersion() {
  const readme = read(path.join(ROOT, 'node_modules/react-native-mmkv/MMKV/README.md'))
  return readme.match(/release-([0-9.]+)-/)?.[1] ?? 'unknown'
}

function textSources() {
  const gh = ({ repo, ref, file }) => `https://raw.githubusercontent.com/${repo}/${ref}/${file}`
  return {
    'folly.txt': gh({
      repo: 'facebook/folly',
      ref: `v${rnCatalogVersion('folly')}`,
      file: 'LICENSE',
    }),
    'glog.txt': gh({
      repo: 'google/glog',
      ref: `v${rnCatalogVersion('glog')}`,
      file: 'COPYING',
    }),
    'double-conversion.txt': gh({
      repo: 'google/double-conversion',
      ref: `v${rnCatalogVersion('doubleconversion')}`,
      file: 'LICENSE',
    }),
    'boost.txt': gh({
      repo: 'boostorg/boost',
      ref: `boost-${rnCatalogVersion('boost').replaceAll('_', '.')}`,
      file: 'LICENSE_1_0.txt',
    }),
    'fmt.txt': gh({
      repo: 'fmtlib/fmt',
      ref: rnCatalogVersion('fmt'),
      file: 'LICENSE',
    }),
    'fast_float.txt': gh({
      repo: 'fastfloat/fast_float',
      ref: `v${rnCatalogVersion('fastFloat')}`,
      file: 'LICENSE-MIT',
    }),
    'hermes.txt': gh({
      repo: 'facebook/hermes',
      ref: hermesRef().commit,
      file: 'LICENSE',
    }),
    'libcxx.txt': gh({
      repo: 'llvm/llvm-project',
      ref: 'main',
      file: 'libcxx/LICENSE.TXT',
    }),
    'mmkv.txt': gh({
      repo: 'Tencent/MMKV',
      ref: `v${mmkvCoreVersion()}`,
      file: 'LICENSE.TXT',
    }),
    ...Object.fromEntries(
      Object.values(ICON_FONT_TEXTS).map(({ file, textUrl }) => [file, textUrl])
    ),
    ...Object.fromEntries(SPDX_IDS.map((id) => [`spdx/${id}.txt`, SPDX_URL(id)])),
  }
}

const readManifest = () => (fs.existsSync(TEXT_MANIFEST) ? JSON.parse(read(TEXT_MANIFEST)) : {})

async function download(url) {
  const response = await fetch(url)
  if (!response.ok) return null
  return normalise(await response.text())
}

function writeManifest(manifest) {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
  fs.mkdirSync(TEXTS, { recursive: true })
  fs.writeFileSync(TEXT_MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`)
}

function keepText({ file, text, url, manifest }) {
  const target = path.join(TEXTS, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${text}\n`)
  manifest[file] = url
  console.log(`fetched ${file} from ${url}`)
}

async function fetchTexts(sources) {
  const manifest = readManifest()
  for (const [file, url] of Object.entries(sources)) {
    if (fs.existsSync(path.join(TEXTS, file)) && manifest[file] === url) continue
    const text = await download(url)
    if (!text) throw new Error(`could not download ${url}`)
    keepText({ file, text, url, manifest })
  }
  writeManifest(manifest)
}

function keptText(file) {
  const target = path.join(TEXTS, file)
  if (!fs.existsSync(target)) {
    throw new Error(
      `scripts/licences/texts/${file} is missing: run \`node scripts/generate-licences.mjs --fetch\` and commit it`
    )
  }
  const expected = textSources()[file]
  if (expected && readManifest()[file] !== expected) {
    warn(
      `scripts/licences/texts/${file} was fetched from another version than ${expected}: run --fetch`
    )
  }
  return normalise(read(target))
}

function upstreamEntry(file) {
  return {
    text: keptText(file),
    textOrigin: 'upstream',
    textUrl: readManifest()[file],
  }
}

function run({ command, commandArgs, cwd }) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  if (result.status !== 0) {
    throw new Error(`\`${command} ${commandArgs.join(' ')}\` failed in ${cwd}`)
  }
  return result.stdout
}

function bundleSources() {
  const given = option('--sourcemap')
  if (given) return JSON.parse(read(path.resolve(given))).sources
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'licences-export-'))
  console.log('exporting the Android bundle with its source map…')
  run({
    command: 'npx',
    commandArgs: [
      'expo',
      'export',
      '--platform',
      'android',
      '--no-bytecode',
      '--source-maps',
      '--output-dir',
      outDir,
    ],
    cwd: MOBILE,
  })
  try {
    const jsDir = path.join(outDir, '_expo/static/js/android')
    const map = fs.readdirSync(jsDir).find((file) => file.endsWith('.js.map'))
    if (!map) throw new Error('expo export wrote no source map')
    return JSON.parse(read(path.join(jsDir, map))).sources
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true })
  }
}

function packageRootsOfSources(sources) {
  const roots = new Set()
  for (const source of sources) {
    const index = source.lastIndexOf('node_modules/')
    if (index < 0) continue
    const [scope, name] = source.slice(index + 'node_modules/'.length).split('/')
    const packagePath =
      source.slice(0, index + 'node_modules/'.length) +
      (scope.startsWith('@') ? `${scope}/${name}` : scope)
    const root = [path.join(ROOT, packagePath), path.join(MOBILE, packagePath)].find((candidate) =>
      fs.existsSync(path.join(candidate, 'package.json'))
    )
    if (!root) throw new Error(`the source map names ${packagePath}, which is not installed`)
    roots.add(fs.realpathSync(root))
  }
  return roots
}

function packageRootAbove({ dir, name }) {
  let current = dir
  while (current !== path.dirname(current)) {
    const manifest = path.join(current, 'package.json')
    if (fs.existsSync(manifest) && JSON.parse(read(manifest)).name === name) return current
    current = path.dirname(current)
  }
  throw new Error(`no package.json named ${name} above ${dir}`)
}

function autolinkedRoots() {
  const roots = new Set()
  const expo = JSON.parse(
    run({
      command: 'npx',
      commandArgs: ['expo-modules-autolinking', 'resolve', '--platform', 'android', '--json'],
      cwd: MOBILE,
    })
  )
  for (const module of expo.modules) {
    const dir = module.projects?.[0]?.sourceDir
    if (dir) roots.add(fs.realpathSync(packageRootAbove({ dir, name: module.packageName })))
  }
  const community = JSON.parse(
    run({
      command: 'npx',
      commandArgs: ['react-native', 'config'],
      cwd: MOBILE,
    })
  )
  for (const dependency of Object.values(community.dependencies)) {
    if (dependency.platforms?.android) roots.add(fs.realpathSync(dependency.root))
  }
  return roots
}

const isInHouse = (root) =>
  root === MOBILE || root === ROOT || root.startsWith(IN_HOUSE_MODULES + path.sep)

const LICENCE_FILE = /^(licen[cs]e|copying)([-._].*)?$/i
const NOTICE_FILE = /^notice([-._].*)?$/i

function licenceFiles(root) {
  const names = fs.readdirSync(root).sort()
  return {
    licences: names.filter((name) => LICENCE_FILE.test(name)),
    notices: names.filter((name) => NOTICE_FILE.test(name)),
  }
}

function declaredLicence(manifest) {
  if (typeof manifest.license === 'string') return manifest.license
  if (manifest.license?.type) return manifest.license.type
  if (Array.isArray(manifest.licenses)) {
    return manifest.licenses.map((licence) => licence.type ?? licence).join(' OR ')
  }
  return 'UNKNOWN'
}

function repositoryUrl(manifest) {
  const repository =
    typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url
  const fromRepository = repository
    ?.replace(/^git\+/, '')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/^github:/, 'https://github.com/')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '')
  const url = fromRepository ?? manifest.homepage
  if (!url) return undefined
  return /^[\w-]+\/[\w.-]+$/.test(url) ? `https://github.com/${url}` : url
}

const githubRepo = (url) => url?.match(/github\.com\/([\w.-]+)\/([\w.-]+)/)?.slice(1)

const upstreamFile = ({ owner, repo }) => `upstream/${owner}__${repo}.txt`

function authorOf(manifest) {
  const author = typeof manifest.author === 'string' ? manifest.author : manifest.author?.name
  return author?.replace(/\s*[<(].*$/, '').trim()
}

const SPDX_COPYRIGHT_PLACEHOLDER =
  /^Copyright (?:\(c\) |\(C\) )?(?:<year> <(?:copyright holders|owner)>|YEAR by AUTHOR EMAIL)\.?[ \t]*\n+/m

function spdxText({ id, holder }) {
  return keptText(`spdx/${id}.txt`).replace(
    SPDX_COPYRIGHT_PLACEHOLDER,
    holder ? `Copyright (c) ${holder}\n\n` : ''
  )
}

function packageEntry({ root, upstreamToFetch }) {
  const manifest = JSON.parse(read(path.join(root, 'package.json')))
  const { licences, notices } = licenceFiles(root)
  const url = repositoryUrl(manifest)
  const licence = declaredLicence(manifest)
  const entry = {
    name: manifest.name,
    version: manifest.version,
    licence,
    url,
  }
  const parts = licences.map((name) => normalise(read(path.join(root, name))))
  const noticeParts = notices.map((name) => normalise(read(path.join(root, name))))
  if (parts.length > 0) {
    return {
      ...entry,
      text: [...parts, ...noticeParts].join('\n\n'),
      textOrigin: 'package',
    }
  }
  const repo = githubRepo(url)
  if (repo) {
    const [owner, name] = repo
    const file = upstreamFile({ owner, repo: name })
    upstreamToFetch.set(file, repo)
    if (fs.existsSync(path.join(TEXTS, file))) {
      return {
        ...entry,
        text: [normalise(read(path.join(TEXTS, file))), ...noticeParts].join('\n\n'),
        textOrigin: 'repository',
        textUrl: readManifest()[file],
      }
    }
  }
  const spdx = licence.replace(/[()]/g, '').split(/\s+(?:AND|OR)\s+/)[0]
  if (!SPDX_IDS.includes(spdx)) {
    throw new Error(`${manifest.name} declares ${licence}, with no text`)
  }
  warn(
    `${manifest.name}@${manifest.version} ships no licence text: the standard ${spdx} text is used`
  )
  return {
    ...entry,
    text: spdxText({ id: spdx, holder: authorOf(manifest) }),
    textOrigin: 'spdx',
  }
}

function mergeByName(entries) {
  const byKey = new Map()
  for (const entry of entries) {
    const key = `${entry.name}\u0000${entry.text}`
    const existing = byKey.get(key)
    if (existing) {
      if (!existing.versions.includes(entry.version)) existing.versions.push(entry.version)
    } else {
      byKey.set(key, { ...entry, versions: [entry.version] })
    }
  }
  return [...byKey.values()].map(({ versions, ...entry }) => ({
    ...entry,
    version: versions.sort().join(', '),
  }))
}

async function fetchUpstreamTexts(upstreamToFetch) {
  const manifest = readManifest()
  const missing = [...upstreamToFetch].filter(([file]) => !fs.existsSync(path.join(TEXTS, file)))
  for (const [file, [owner, repo]] of missing) {
    let fetched = false
    for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING']) {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${name}`
      const text = await download(url)
      if (!text) continue
      keepText({ file, text, url, manifest })
      fetched = true
      break
    }
    if (!fetched) warn(`no licence file found in ${owner}/${repo}`)
  }
  writeManifest(manifest)
}

async function appLibraries(sources) {
  const roots = new Set([...packageRootsOfSources(sources), ...autolinkedRoots()])
  const upstreamToFetch = new Map()
  const collect = () =>
    [...roots]
      .filter((root) => !isInHouse(root))
      .map((root) => packageEntry({ root, upstreamToFetch }))
  let entries = collect()
  if (flag('--fetch')) {
    await fetchUpstreamTexts(upstreamToFetch)
    warnings.length = 0
    entries = collect()
  }
  return mergeByName(entries)
}

const SKIPPED_DIRS = new Set(['build', '.cxx', '.gradle', 'node_modules'])

function directoriesNamed({ dir, name }) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    if (!dirent.isDirectory() || SKIPPED_DIRS.has(dirent.name)) return []
    const child = path.join(dir, dirent.name)
    return dirent.name === name ? [child] : directoriesNamed({ dir: child, name })
  })
}

const NATIVE_SOURCE_FILE = /\.(c|cc|cpp|cxx|h|hh|hpp|hxx)$/i

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    const file = path.join(dir, dirent.name)
    if (dirent.isDirectory()) return sourceFiles(file)
    return NATIVE_SOURCE_FILE.test(dirent.name) ? [file] : []
  })
}

function copyrightLines({ dir, alreadyStated }) {
  const lines = new Set()
  for (const file of sourceFiles(dir)) {
    for (const match of read(file).matchAll(
      /Copyright\s*(?:\(c\)|\(C\)|©)?\s*(?:19|20)\d\d[^\n]*/g
    )) {
      const line = match[0]
        .replace(/\*\/.*$/, '')
        .replace(/\s+/g, ' ')
        .replace(/[\s.]+$/, '')
        .trim()
      if (!alreadyStated.includes(line)) lines.add(line)
    }
  }
  return [...lines].sort()
}

const NOTICE_FIELDS = /^- (Licence|Version|URL|Text|Note): (.+)$/gm

function noticeOf(dir) {
  const file = path.join(dir, 'NOTICE.md')
  if (!fs.existsSync(file)) {
    throw new Error(
      `${relative(dir)} is vendored without a NOTICE.md, so scripts/generate-licences.mjs cannot list it: write one (CLAUDE.md, Legal links)`
    )
  }
  const notice = read(file)
  const fields = { name: notice.match(/^# (.+)$/m)?.[1]?.trim(), notes: [] }
  for (const [, key, value] of notice.matchAll(NOTICE_FIELDS)) {
    if (key === 'Note') fields.notes.push(value.trim())
    else fields[key] ??= value.trim()
  }
  const missing = [
    ...(fields.name ? [] : ['a `# Name` heading']),
    ...['Licence', 'URL'].filter((key) => !fields[key]).map((key) => `\`- ${key}: …\``),
  ]
  if (missing.length > 0) {
    throw new Error(
      `${relative(file)} lacks ${missing.join(', ')}, which scripts/generate-licences.mjs reads`
    )
  }
  return fields
}

function vendoredText({ dir, textField }) {
  const names = textField
    ? textField.split(',').map((name) => name.trim().replace(/^`|`$/g, ''))
    : licenceFiles(dir).licences
  if (names.length === 0) {
    throw new Error(
      `${relative(dir)} holds no licence text: vendor its COPYING or LICENSE, or name the file with \`- Text: …\` in its NOTICE.md`
    )
  }
  return names
    .map((name) => {
      const file = path.join(dir, name)
      if (!fs.existsSync(file))
        throw new Error(`${relative(file)}, named by its NOTICE.md, is missing`)
      return normalise(read(file))
    })
    .join('\n\n')
}

function vendoredDirectories(thirdParty) {
  const dirents = fs.readdirSync(thirdParty, { withFileTypes: true })
  const loose = dirents.filter(
    (dirent) => !dirent.isDirectory() && NATIVE_SOURCE_FILE.test(dirent.name)
  )
  if (loose.length > 0) {
    throw new Error(
      `${loose.map((dirent) => relative(path.join(thirdParty, dirent.name))).join(', ')} sits directly in ${relative(thirdParty)}, so scripts/generate-licences.mjs cannot tell which library it belongs to: vendor it in its own \`${relative(thirdParty)}/<lib>/\` folder, with its NOTICE.md (CLAUDE.md, Legal links)`
    )
  }
  return dirents
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(thirdParty, dirent.name))
}

function vendoredLibraries() {
  return directoriesNamed({ dir: IN_HOUSE_MODULES, name: 'third_party' })
    .flatMap(vendoredDirectories)
    .sort()
    .map((dir) => {
      const notice = noticeOf(dir)
      const text = vendoredText({ dir, textField: notice.Text })
      const holders = copyrightLines({ dir, alreadyStated: text })
      return {
        id: `native:vendored:${path.relative(IN_HOUSE_MODULES, dir).split(path.sep).join('/')}`,
        name: notice.name,
        version: notice.Version ?? '',
        licence: notice.Licence,
        url: notice.URL,
        notes:
          holders.length > 0
            ? [...notice.notes, `Also named in its source files: ${holders.join('; ')}.`]
            : notice.notes,
        text,
        textOrigin: 'vendored',
      }
    })
}

function compiledIntoReactNative() {
  const rnVersion = JSON.parse(read(path.join(RN, 'package.json'))).version
  const mmkvVersion = JSON.parse(
    read(path.join(ROOT, 'node_modules/react-native-mmkv/package.json'))
  ).version
  const inReactNative = `Compiled into React Native ${rnVersion}'s native libraries.`
  return [
    {
      id: 'native:mmkv-core',
      name: 'MMKV core (Tencent)',
      version: `${mmkvCoreVersion()}, in react-native-mmkv ${mmkvVersion}`,
      licence: 'BSD-3-Clause AND OpenSSL AND Zlib',
      url: 'https://github.com/Tencent/MMKV',
      notes: [],
      ...upstreamEntry('mmkv.txt'),
    },
    {
      id: 'native:hermes',
      name: 'Hermes',
      version: hermesRef().tag,
      licence: 'MIT',
      url: 'https://github.com/facebook/hermes',
      notes: [`The JavaScript engine of React Native ${rnVersion}.`],
      ...upstreamEntry('hermes.txt'),
    },
    ...[
      ['folly', 'Folly', 'folly', 'Apache-2.0', 'https://github.com/facebook/folly'],
      ['glog', 'glog', 'glog', 'BSD-3-Clause', 'https://github.com/google/glog'],
      [
        'double-conversion',
        'double-conversion',
        'doubleconversion',
        'BSD-3-Clause',
        'https://github.com/google/double-conversion',
      ],
      ['boost', 'Boost', 'boost', 'BSL-1.0', 'https://www.boost.org'],
      ['fmt', '{fmt}', 'fmt', 'MIT', 'https://github.com/fmtlib/fmt'],
      ['fast_float', 'fast_float', 'fastFloat', 'MIT', 'https://github.com/fastfloat/fast_float'],
    ].map(([id, name, key, licence, url]) => ({
      id: `native:${id}`,
      name,
      version: rnCatalogVersion(key).replaceAll('_', '.'),
      licence,
      url,
      notes: [inReactNative],
      ...upstreamEntry(`${id}.txt`),
    })),
    {
      id: 'native:libcxx',
      name: 'libc++ (LLVM)',
      version: '',
      licence: 'Apache-2.0 WITH LLVM-exception',
      url: 'https://libcxx.llvm.org',
      notes: ['The C++ standard library of the Android NDK, shipped as libc++_shared.so.'],
      ...upstreamEntry('libcxx.txt'),
    },
  ]
}

function nativeLibraries() {
  return [...vendoredLibraries(), ...compiledIntoReactNative()]
}

const ICON_FONT_TEXTS = {
  Ionicons: {
    file: 'ionicons.txt',
    licence: 'MIT',
    url: 'https://github.com/ionic-team/ionicons',
    textUrl: 'https://raw.githubusercontent.com/ionic-team/ionicons/main/LICENSE',
  },
}

function keptIconFamilies() {
  const plugin = read(path.join(MOBILE, 'plugins/withAndroidFontFilter.js'))
  const list = plugin.match(/const KEEP_FONTS = \[([^\]]*)\]/)?.[1]
  if (list === undefined) throw new Error('withAndroidFontFilter.js lost KEEP_FONTS')
  return [...list.matchAll(/'([^']+)'/g)].map((match) => match[1])
}

function iconFonts() {
  const vectorIcons = JSON.parse(
    read(path.join(ROOT, 'node_modules/@expo/vector-icons/package.json'))
  ).version
  return keptIconFamilies().map((family) => {
    const source = ICON_FONT_TEXTS[family]
    if (!source) {
      throw new Error(
        `withAndroidFontFilter keeps ${family}, whose licence scripts/generate-licences.mjs does not know: add it to ICON_FONT_TEXTS and run --fetch`
      )
    }
    return {
      id: `font:${family.toLowerCase()}`,
      name: family,
      version: `in @expo/vector-icons ${vectorIcons}`,
      licence: source.licence,
      url: source.url,
      notes: [],
      ...upstreamEntry(source.file),
    }
  })
}

const FONT_FILE = /\.(ttf|otf)$/i
const FONT_LICENCE_FILE = /^(ofl|licen[cs]e|copying)([-._].*)?$/i
const isFontLicenceText = (name) => FONT_LICENCE_FILE.test(name) && !/faq/i.test(name)
const FONT_LICENCES = [
  { id: 'OFL-1.1', pattern: /SIL Open Font License,?\s+Version 1\.1/i },
  { id: 'Apache-2.0', pattern: /Apache License,?\s+Version 2\.0/i },
  { id: 'UFL-1.0', pattern: /Ubuntu Font Licen[cs]e,?\s+Version 1\.0/i },
  { id: 'MIT', pattern: /Permission is hereby granted, free of charge/i },
]

function expoFontPluginFiles() {
  const script = `
    const config = require('./app.config.js').default()
    const plugin = config.expo.plugins.find((entry) => Array.isArray(entry) && entry[0] === 'expo-font')
    const files = []
    const walk = (value) => {
      if (typeof value === 'string') files.push(value)
      else if (value && typeof value === 'object') Object.values(value).forEach(walk)
    }
    walk(plugin ? plugin[1] : null)
    process.stdout.write(JSON.stringify(files))
  `
  const values = JSON.parse(
    run({
      command: process.execPath,
      commandArgs: ['-e', script],
      cwd: MOBILE,
    })
  )
  return values.filter((value) => FONT_FILE.test(value)).map((value) => path.resolve(MOBILE, value))
}

function fontDirectories(dir) {
  if (!fs.existsSync(dir)) return []
  const dirents = fs.readdirSync(dir, { withFileTypes: true })
  const fonts = dirents.filter((dirent) => dirent.isFile() && FONT_FILE.test(dirent.name))
  const nested = dirents
    .filter((dirent) => dirent.isDirectory())
    .flatMap((dirent) => fontDirectories(path.join(dir, dirent.name)))
  return fonts.length > 0
    ? [{ dir, fonts: fonts.map((dirent) => dirent.name).sort() }, ...nested]
    : nested
}

function familyOf(file) {
  const stem = path.basename(file, path.extname(file))
  const [family, ...style] = stem.split(/[-[]/)
  return {
    family,
    style: style.length > 0 ? stem.slice(family.length).replace(/^-/, '') : 'Regular',
  }
}

function bundledFontFiles(sources) {
  return sources
    .filter((source) => FONT_FILE.test(source) && !source.includes('/node_modules/'))
    .map(
      (source) =>
        [path.join(ROOT, source), path.join(MOBILE, source)].find((file) => fs.existsSync(file)) ??
        path.join(ROOT, source)
    )
}

function fontFilesOutsideFontsDir(sources) {
  const isOutside = (file) => !file.startsWith(FONTS + path.sep)
  const strays = fontDirectories(path.join(MOBILE, 'assets'))
    .filter(({ dir }) => dir !== FONTS && !dir.startsWith(FONTS + path.sep))
    .flatMap(({ dir, fonts }) => fonts.map((font) => path.join(dir, font)))
  const fromPlugin = expoFontPluginFiles().filter(isOutside)
  const fromBundle = bundledFontFiles(sources).filter(isOutside)
  return [...new Set([...strays, ...fromPlugin, ...fromBundle])]
}

function embeddedFonts(sources) {
  const outside = fontFilesOutsideFontsDir(sources)
  if (outside.length > 0) {
    throw new Error(
      `${outside.map(relative).join(', ')} sits outside apps/mobile/assets/fonts, where scripts/generate-licences.mjs reads the fonts the app embeds: move it there, beside its licence text`
    )
  }
  return fontDirectories(FONTS).flatMap(({ dir, fonts }) => {
    const texts = fs.readdirSync(dir).filter(isFontLicenceText)
    if (texts.length === 0) {
      throw new Error(
        `${relative(path.join(dir, fonts[0]))} has no licence text beside it: put the font's own (OFL.txt, LICENSE.txt) in its folder`
      )
    }
    if (texts.length > 1) {
      throw new Error(
        `${relative(dir)} holds ${texts.join(', ')}: give each font family its own folder, with its one licence text`
      )
    }
    const text = normalise(read(path.join(dir, texts[0])))
    const licence = FONT_LICENCES.find(({ pattern }) => pattern.test(text))?.id
    if (!licence) {
      throw new Error(
        `${relative(path.join(dir, texts[0]))} is not a licence scripts/generate-licences.mjs recognises (${FONT_LICENCES.map(({ id }) => id).join(', ')}): add it to FONT_LICENCES`
      )
    }
    const url = text.match(/\((https?:\/\/[^)\s]+)\)/)?.[1]
    const families = new Map()
    for (const font of fonts) {
      const { family, style } = familyOf(font)
      families.set(family, [...(families.get(family) ?? []), style])
    }
    const folder = path.relative(FONTS, dir).split(path.sep).join('/')
    return [...families].map(([family, styles]) => ({
      id: `font:${[folder, family.toLowerCase()].filter(Boolean).join('/')}`,
      name: family,
      version: styles.join(', '),
      licence,
      ...(url ? { url } : {}),
      notes: [],
      text,
      textOrigin: 'vendored',
    }))
  })
}

function fonts(sources) {
  return [...embeddedFonts(sources), ...iconFonts()]
}

const PROPRIETARY_GROUPS = [
  /^com\.google\.android\.gms$/,
  /^com\.google\.android\.ump$/,
  /^com\.android\.billingclient$/,
  /^com\.google\.android\.play$/,
  /^com\.google\.firebase$/,
  /^com\.google\.android\.datatransport$/,
]

const TERMS_FALLBACK_URL = 'https://developer.android.com/studio/terms'

function spdxOfPomLicence({ name = '', url = '' }) {
  const both = `${name} ${url}`.toLowerCase()
  if (/apache/.test(both) && /2/.test(both)) return 'Apache-2.0'
  if (/\bmit\b|opensource\.org\/licenses\/mit/.test(both)) return 'MIT'
  if (/bsd.{0,12}3|3-clause|new bsd|revised bsd/.test(both)) return 'BSD-3-Clause'
  if (/bsd.{0,12}2|2-clause|simplified bsd/.test(both)) return 'BSD-2-Clause'
  if (/\bisc\b/.test(both)) return 'ISC'
  return undefined
}

function androidReport() {
  const given = option('--android-report')
  if (given) return JSON.parse(read(path.resolve(given)))
  const androidDir = path.join(MOBILE, 'android')
  if (!fs.existsSync(path.join(androidDir, 'gradlew'))) {
    throw new Error(
      'apps/mobile/android is missing: run `pnpm --filter mobile preb:android --clean` first'
    )
  }
  const report = path.join(os.tmpdir(), `licences-android-${process.pid}.json`)
  console.log("resolving Gradle's release runtime classpath…")
  // The release workflow builds with --no-daemon: a daemon left idle by this run would hold its
  // 4 GiB heap beside the one R8 needs, on a runner already short of memory. Locally both runs
  // share one daemon, which is why the flag follows CI.
  const result = spawnSync(
    './gradlew',
    [
      '-q',
      '--console=plain',
      ...(process.env.CI === 'true' ? ['--no-daemon'] : []),
      '-I',
      INIT_SCRIPT,
      ':app:licencesReport',
      `-PlicencesOutput=${report}`,
    ],
    { cwd: androidDir, stdio: 'inherit' }
  )
  if (result.status !== 0) throw new Error(':app:licencesReport failed')
  const parsed = JSON.parse(read(report))
  fs.rmSync(report, { force: true })
  return parsed
}

function androidLibraries(report) {
  const byGroup = new Map()
  for (const artifact of report.artifacts) {
    const isProprietary =
      PROPRIETARY_GROUPS.some((pattern) => pattern.test(artifact.group)) &&
      !artifact.licences.some((licence) => spdxOfPomLicence(licence))
    const licences = artifact.licences.length
      ? artifact.licences
      : [{ name: 'No licence declared in its POM', url: '' }]
    const key = `${artifact.group}\u0000${JSON.stringify(licences)}\u0000${isProprietary}`
    const group = byGroup.get(key) ?? {
      group: artifact.group,
      licences,
      isProprietary,
      artifacts: [],
      url: artifact.url,
      holder: artifact.organization,
    }
    group.artifacts.push(`${artifact.name} ${artifact.version}`)
    group.url ??= artifact.url
    group.holder ??= artifact.organization
    byGroup.set(key, group)
  }
  return [...byGroup.values()]
    .sort((a, b) => a.group.localeCompare(b.group))
    .map((group, index) => {
      const spdx = group.licences.map(spdxOfPomLicence).find(Boolean)
      const licenceNames = group.licences.map((licence) => licence.name || licence.url).join(' / ')
      const links = group.licences.map((licence) => licence.url).filter(Boolean)
      const base = {
        id: `android:${group.group}:${index}`,
        name: group.group,
        version: group.artifacts.sort().join(', '),
        url: group.url,
      }
      if (group.isProprietary) {
        return {
          ...base,
          licence: licenceNames,
          notes: ["Distributed under Google's own terms, not an open-source licence."],
          textOrigin: 'terms',
          termsUrl: links[0] ?? TERMS_FALLBACK_URL,
        }
      }
      const notes = [
        ...(links.length ? [`Licence as its POM declares it: ${links.join(', ')}`] : []),
        ...(group.holder ? [`Published by ${group.holder}.`] : []),
      ]
      if (!spdx) return { ...base, licence: licenceNames, notes, textOrigin: 'pom' }
      return {
        ...base,
        licence: spdx,
        notes,
        text: spdxText({ id: spdx, holder: group.holder }),
        textOrigin: spdx === 'Apache-2.0' ? 'spdx' : 'spdx-template',
      }
    })
}

function withSharedTexts(sections) {
  const texts = {}
  const out = {}
  for (const [section, entries] of Object.entries(sections)) {
    out[section] = entries.map(({ text, ...entry }, index) => {
      const base = {
        id: entry.id ?? `${section}:${entry.name}:${index}`,
        name: entry.name,
        version: entry.version ?? '',
        licence: entry.licence,
        ...(entry.url ? { url: entry.url } : {}),
        notes: entry.notes ?? [],
        textOrigin: entry.textOrigin,
        ...(entry.textUrl ? { textUrl: entry.textUrl } : {}),
        ...(entry.termsUrl ? { termsUrl: entry.termsUrl } : {}),
      }
      if (!text) return base
      const textId = createHash('sha256').update(text).digest('hex').slice(0, 12)
      texts[textId] = text
      return { ...base, textId }
    })
  }
  return { sections: out, texts }
}

function previousAndroid(previous) {
  if (previous?.android?.status !== 'generated') return { status: 'pending', entries: [] }
  console.log('kept the Android list of the previous run (pass --android to resolve it again)')
  return {
    status: 'generated',
    entries: previous.sections.android.map((entry) => ({
      ...entry,
      text: entry.textId ? previous.texts[entry.textId] : undefined,
    })),
  }
}

async function main() {
  if (flag('--fetch')) await fetchTexts(textSources())
  const previous = fs.existsSync(OUTPUT) ? JSON.parse(read(OUTPUT)) : null
  const sources = bundleSources()
  const app = (await appLibraries(sources)).sort((a, b) => a.name.localeCompare(b.name))
  const native = nativeLibraries()
  const fontList = fonts(sources)
  const android =
    flag('--android') || option('--android-report')
      ? { status: 'generated', entries: androidLibraries(androidReport()) }
      : previousAndroid(previous)

  const { sections, texts } = withSharedTexts({
    app,
    native,
    fonts: fontList,
    android: android.entries,
  })
  const file = {
    generatedBy: 'scripts/generate-licences.mjs',
    android: { status: android.status },
    sections,
    texts: Object.fromEntries(Object.entries(texts).sort(([a], [b]) => a.localeCompare(b))),
  }
  fs.writeFileSync(OUTPUT, `${JSON.stringify(file, null, 2)}\n`)
  const count = Object.values(sections).reduce((total, entries) => total + entries.length, 0)
  console.log(
    `wrote ${relative(OUTPUT)}: ${sections.app.length} app, ${sections.native.length} native, ${sections.fonts.length} fonts, ${sections.android.length} Android (${android.status}) — ${count} entries, ${Object.keys(texts).length} texts`
  )
  if (warnings.length > 0) console.warn(`${warnings.length} warning(s) above`)
}

main().catch((error) => {
  console.error(`generate-licences: ${error.message}`)
  process.exit(1)
})
