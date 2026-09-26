const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

// The encrypted entitlement store (services/storage/secure.ts). MMKV writes `<id>` and `<id>.crc`
// under files/mmkv/, so both are named — rename them with the instance id.
const ENTITLEMENT_STORE = ['mmkv/entitlements', 'mmkv/entitlements.crc']

const excludeAll = ({ paths, indent }) =>
  paths.map((p) => `${indent}<exclude domain="file" path="${p}" />`).join('\n')

// Out of every copy that leaves the device: a copy can be edited into Pro and restored. The rest
// still rides along — preferences, the onboarding, the review and paywall spacing follow the user.
const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
${excludeAll({ paths: ENTITLEMENT_STORE, indent: '    ' })}
  </cloud-backup>
  <device-transfer>
${excludeAll({ paths: ENTITLEMENT_STORE, indent: '    ' })}
  </device-transfer>
</data-extraction-rules>
`

// Android 11 and below, which minSdkVersion 26 still reaches, read this one instead, with no split
// between cloud backup and device transfer.
const FULL_BACKUP_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
${excludeAll({ paths: ENTITLEMENT_STORE, indent: '  ' })}
</full-backup-content>
`

function withBackupRules(config) {
  const withRuleFiles = withDangerousMod(config, [
    'android',
    (mod) => {
      const xmlDir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml')
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.writeFileSync(path.join(xmlDir, 'data_extraction_rules.xml'), DATA_EXTRACTION_RULES)
      fs.writeFileSync(path.join(xmlDir, 'backup_rules.xml'), FULL_BACKUP_CONTENT)
      return mod
    },
  ])

  return withAndroidManifest(withRuleFiles, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults)
    application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules'
    application.$['android:fullBackupContent'] = '@xml/backup_rules'
    return mod
  })
}

module.exports = withBackupRules
