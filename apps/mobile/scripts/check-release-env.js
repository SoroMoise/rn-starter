const path = require('path')
const { getConfig } = require('@expo/config')

const projectRoot = path.dirname(require.resolve('../package.json'))

const DEVELOPMENT_OVERRIDES = [
  {
    name: 'FORCE_FREE',
    isSet: (extra) => extra?.purchases?.forceFree === true,
    reason: 'locks every subscriber out of what they pay for',
  },
  {
    name: 'FORCE_PRO',
    isSet: (extra) => extra?.purchases?.forcePro === true,
    reason: 'gives Pro away to every user',
  },
  {
    name: 'UMP_DEBUG_GEOGRAPHY',
    isSet: (extra) => String(extra?.consentDebug?.geography ?? '').trim() !== '',
    reason: "is a development aid for Google's consent form",
  },
  {
    name: 'UMP_TEST_DEVICE_IDS',
    isSet: (extra) => String(extra?.consentDebug?.testDeviceIds ?? '').trim() !== '',
    reason: "is a development aid for Google's consent form",
  },
]

// Loaded exactly as expo-constants loads it for the config a release embeds
// (scripts/getAppConfig.js): a grep of .env missed `.env.local`, a variable exported in the shell
// and a `KEY: value` line, all three of which reach the build.
require('@expo/env').load(projectRoot, { silent: true })
process.chdir(projectRoot)
const { exp } = getConfig(projectRoot, { isPublicConfig: true, skipSDKVersionRequirement: true })

const found = DEVELOPMENT_OVERRIDES.filter((override) => override.isSet(exp.extra))
if (found.length > 0) {
  const prefix = process.env.GITHUB_ACTIONS === 'true' ? '::error::' : ''
  for (const { name, reason } of found) {
    console.error(`${prefix}${name} is set for a release build: it ${reason}.`)
  }
  console.error(
    `${prefix}A release is never built with a development override: unset it wherever it comes ` +
      'from (apps/mobile/.env, .env.local, the shell, the MOBILE_DOTENV secret) and build again.'
  )
  process.exit(1)
}
