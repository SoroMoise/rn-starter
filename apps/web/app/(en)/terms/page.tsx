import { LegalPage, legalMetadata } from '@/lib/pages'

export const metadata = legalMetadata({ locale: 'en', route: 'terms' })

export default function Page() {
  return <LegalPage locale="en" route="terms" />
}
