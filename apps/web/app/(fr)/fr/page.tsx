import { HomePage, homeMetadata } from '@/lib/pages'

export const metadata = homeMetadata('fr')

export default function Page() {
  return <HomePage locale="fr" />
}
