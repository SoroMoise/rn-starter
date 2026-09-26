import { HomePage, homeMetadata } from '@/lib/pages'

export const metadata = homeMetadata('en')

export default function Page() {
  return <HomePage locale="en" />
}
