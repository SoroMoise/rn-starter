import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import { parseRich, typeset, type RichToken } from '@/lib/richText'

function renderTokens({ tokens, locale }: { tokens: RichToken[]; locale: Locale }): ReactNode {
  return tokens.map((token, index) => {
    if (token.kind === 'text') {
      return <Fragment key={index}>{typeset({ text: token.value, locale })}</Fragment>
    }
    if (token.kind === 'bold') {
      return <strong key={index}>{renderTokens({ tokens: token.children, locale })}</strong>
    }
    const label = typeset({ text: token.label, locale })
    if (token.external) {
      return (
        <a key={index} href={token.href} rel="noopener">
          {label}
        </a>
      )
    }
    return (
      <Link key={index} href={token.href}>
        {label}
      </Link>
    )
  })
}

export function RichText({ text, locale }: { text: string; locale: Locale }) {
  return <>{renderTokens({ tokens: parseRich({ text, locale }), locale })}</>
}

export function Typeset({ text, locale }: { text: string; locale: Locale }) {
  return <>{typeset({ text, locale })}</>
}
