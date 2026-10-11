import type { LicenceEntry, LicenceSectionId, LicencesFile } from '@/types'

export const LICENCE_SECTIONS: readonly LicenceSectionId[] = ['app', 'native', 'fonts', 'android']

export type LicenceListRow =
  | { kind: 'header'; key: string; section: LicenceSectionId; count: number | null }
  | {
      kind: 'entry'
      key: string
      section: LicenceSectionId
      entry: LicenceEntry
      isFirst: boolean
      isLast: boolean
    }
  | { kind: 'androidPending'; key: string }

let cached: LicencesFile | null = null

// Required here, never imported at the top: a static import would evaluate the generated list
// at launch.
export function loadLicences(): LicencesFile {
  cached ??= require('@/constants/licences.generated.json') as LicencesFile
  return cached
}

export function buildLicenceRows(file: LicencesFile): LicenceListRow[] {
  return LICENCE_SECTIONS.flatMap((section): LicenceListRow[] => {
    const entries = file.sections[section]
    const isPending = section === 'android' && file.android.status === 'pending'
    const header: LicenceListRow = {
      kind: 'header',
      key: `header:${section}`,
      section,
      count: isPending ? null : entries.length,
    }
    if (isPending) return [header, { kind: 'androidPending', key: 'android:pending' }]
    if (entries.length === 0) return []
    return [
      header,
      ...entries.map(
        (entry, index): LicenceListRow => ({
          kind: 'entry',
          key: entry.id,
          section,
          entry,
          isFirst: index === 0,
          isLast: index === entries.length - 1,
        })
      ),
    ]
  })
}
