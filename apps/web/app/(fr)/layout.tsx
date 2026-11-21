import type { Viewport } from 'next'
import type { ReactNode } from 'react'
import { RootHtml, VIEWPORT } from '@/components/RootHtml'

export const viewport: Viewport = VIEWPORT

export default function FrenchRootLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="fr">{children}</RootHtml>
}
