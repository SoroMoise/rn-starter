import { notFound } from 'next/navigation'
import { pageMetadata, SitePage } from '@/components/pages'
import { routeForSlug, staticParams } from '@/lib/routes'

type Props = { params: Promise<{ slug?: string[] }> }

export const dynamicParams = false

export function generateStaticParams() {
  return staticParams('en')
}

export async function generateMetadata({ params }: Props) {
  const route = routeForSlug({ locale: 'en', slug: (await params).slug })
  return route ? pageMetadata({ locale: 'en', route }) : {}
}

export default async function Page({ params }: Props) {
  const route = routeForSlug({ locale: 'en', slug: (await params).slug })
  if (!route) notFound()
  return <SitePage locale="en" route={route} />
}
