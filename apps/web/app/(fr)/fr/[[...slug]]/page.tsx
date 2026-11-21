import { notFound } from 'next/navigation'
import { pageMetadata, SitePage } from '@/components/pages'
import { routeForSlug, staticParams } from '@/lib/routes'

type Props = { params: Promise<{ slug?: string[] }> }

export const dynamicParams = false

export function generateStaticParams() {
  return staticParams('fr')
}

export async function generateMetadata({ params }: Props) {
  const route = routeForSlug({ locale: 'fr', slug: (await params).slug })
  return route ? pageMetadata({ locale: 'fr', route }) : {}
}

export default async function Page({ params }: Props) {
  const route = routeForSlug({ locale: 'fr', slug: (await params).slug })
  if (!route) notFound()
  return <SitePage locale="fr" route={route} />
}
