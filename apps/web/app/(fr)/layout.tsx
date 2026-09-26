import type { ReactNode } from 'react'
import { RootHtml } from '@/components/RootHtml'

export default function FrenchRootLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="fr">{children}</RootHtml>
}
