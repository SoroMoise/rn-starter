import type { Locale } from './i18n'
import { ROUTES, isRouteKey } from './routes'
import { absoluteUrl } from './url'

export type RichToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; children: RichToken[] }
  | { kind: 'link'; label: string; href: string; external: boolean }

const MARKS = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
const EXTERNAL = /^(https?:|mailto:)/

export function resolveTarget({ target, locale }: { target: string; locale: Locale }): {
  href: string
  external: boolean
} {
  if (EXTERNAL.test(target)) return { href: target, external: true }
  const [key = '', anchor] = target.split('#')
  if (!isRouteKey(key)) throw new Error(`Unknown route key in rich text: "${target}"`)
  const path = ROUTES[key][locale]
  return { href: anchor ? `${path}#${anchor}` : path, external: false }
}

export function parseRich({ text, locale }: { text: string; locale: Locale }): RichToken[] {
  const tokens: RichToken[] = []
  let last = 0
  for (const match of text.matchAll(MARKS)) {
    const index = match.index ?? 0
    if (index > last) tokens.push({ kind: 'text', value: text.slice(last, index) })
    const [, bold, label, target] = match
    if (bold !== undefined) {
      tokens.push({ kind: 'bold', children: parseRich({ text: bold, locale }) })
    } else if (label !== undefined && target !== undefined) {
      tokens.push({ kind: 'link', label, ...resolveTarget({ target, locale }) })
    }
    last = index + match[0].length
  }
  if (last < text.length) tokens.push({ kind: 'text', value: text.slice(last) })
  return tokens
}

const UNIT_SPACE = /(\d) (?=%|(?:ms|s|min|minutes?|secondes?|seconds?|h|KB|Ko|MB|Mo|GB|Go)\b)/g

export function typeset({ text, locale }: { text: string; locale: Locale }): string {
  const units = text.replace(UNIT_SPACE, '$1 ')
  if (locale !== 'fr') return units
  return units.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ')
}

export function richToPlain({ text, locale }: { text: string; locale: Locale }): string {
  return parseRich({ text, locale })
    .map((token) => tokenToPlain(token))
    .join('')
}

function tokenToPlain(token: RichToken): string {
  if (token.kind === 'text') return token.value
  if (token.kind === 'bold') return token.children.map(tokenToPlain).join('')
  return token.label
}

export function richToMarkdown({ text, locale }: { text: string; locale: Locale }): string {
  return parseRich({ text, locale })
    .map((token) => tokenToMarkdown(token))
    .join('')
}

function tokenToMarkdown(token: RichToken): string {
  if (token.kind === 'text') return token.value
  if (token.kind === 'bold') return `**${token.children.map(tokenToMarkdown).join('')}**`
  return `[${token.label}](${token.external ? token.href : absoluteUrl(token.href)})`
}
