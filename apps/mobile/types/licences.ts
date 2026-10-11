export type LicenceSectionId = 'app' | 'native' | 'fonts' | 'android'

export type LicenceTextOrigin =
  | 'package'
  | 'repository'
  | 'upstream'
  | 'vendored'
  | 'spdx'
  | 'spdx-template'
  | 'pom'
  | 'terms'

export type LicenceEntry = {
  id: string
  name: string
  version: string
  licence: string
  url?: string
  notes: string[]
  textOrigin: LicenceTextOrigin
  textId?: string
  textUrl?: string
  termsUrl?: string
}

export type LicencesFile = {
  generatedBy: string
  android: { status: 'pending' | 'generated' }
  sections: Record<LicenceSectionId, LicenceEntry[]>
  texts: Record<string, string>
}
