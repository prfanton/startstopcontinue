import type { Card, Vote, Session } from '@/types/retro'
import { getFormat } from './sessionFormats'

export function exportMarkdown(
  session: Session,
  cards: Card[],
  votes: Record<string, Vote[]>,
  participants: Record<string, string> // user_key → display_name
): string {
  const format = getFormat(session.format)
  const date = new Date(session.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const lines: string[] = [
    `# ${session.title}`,
    `_${date}_`,
    '',
  ]

  for (const col of format.columns) {
    lines.push(`## ${col.label}`)
    const colCards = cards
      .filter(c => c.column_id === col.id && c.content.trim())
      .sort((a, b) => (votes[b.id]?.length ?? 0) - (votes[a.id]?.length ?? 0))

    if (colCards.length === 0) {
      lines.push('_No items_')
    } else {
      for (const card of colCards) {
        const voteCount = votes[card.id]?.length ?? 0
        const author = participants[card.author_key] ?? 'Unknown'
        const votes_str = voteCount > 0 ? ` _(${voteCount} vote${voteCount !== 1 ? 's' : ''})_` : ''
        lines.push(`- ${card.content}${votes_str}`)
        lines.push(`  — _${author}_`)
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}
