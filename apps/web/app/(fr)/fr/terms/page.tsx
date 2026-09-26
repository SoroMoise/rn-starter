import { LegalPage, legalMetadata } from '@/lib/pages'

export const metadata = legalMetadata({ locale: 'fr', route: 'terms' })

export default function Page() {
  return <LegalPage locale="fr" route="terms" />
}
