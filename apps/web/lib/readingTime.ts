import type { Block, Section } from '@/content/types'

const WORDS_PER_MINUTE = 220

function blockText(block: Block): string {
  switch (block.type) {
    case 'p':
    case 'callout':
      return block.text
    case 'list':
      return block.items.join(' ')
    case 'steps':
      return block.items.map((item) => `${item.title} ${item.text}`).join(' ')
    case 'table':
      return block.rows.flat().join(' ')
    case 'h3':
      return block.text
    default:
      return ''
  }
}

export function readingMinutes({ lead, sections }: { lead: string; sections: Section[] }): number {
  const text = [
    lead,
    ...sections.flatMap((section) => [section.title, ...section.blocks.map(blockText)]),
  ].join(' ')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}
