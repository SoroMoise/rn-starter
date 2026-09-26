import type { ReactNode } from 'react'
import { RootHtml } from '@/components/RootHtml'

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="en">{children}</RootHtml>
}
