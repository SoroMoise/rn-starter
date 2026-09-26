import { LegalPage, legalMetadata } from '@/lib/pages'

export const metadata = legalMetadata({ locale: 'en', route: 'privacy' })

export default function Page() {
  return <LegalPage locale="en" route="privacy" />
}
