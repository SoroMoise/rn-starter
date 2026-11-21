import type { Viewport } from 'next'
import type { ReactNode } from 'react'
import { RootHtml, VIEWPORT } from '@/components/RootHtml'

export const viewport: Viewport = VIEWPORT

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return <RootHtml locale="en">{children}</RootHtml>
}
