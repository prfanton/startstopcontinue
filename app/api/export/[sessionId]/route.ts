import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { exportMarkdown } from '@/lib/utils/exportMarkdown'
import type { Session, Card, Vote } from '@/types/retro'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const supabase = await getSupabaseServerClient()

  const [sessionRes, cardsRes, participantsRes] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', sessionId).single(),
    supabase.from('cards').select('*').eq('session_id', sessionId),
    supabase.from('participants').select('*').eq('session_id', sessionId),
  ])

  if (sessionRes.error || !sessionRes.data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const session = sessionRes.data as Session
  const cards = (cardsRes.data ?? []) as Card[]
  const participants = participantsRes.data ?? []

  // Fetch votes for all cards in this session
  const cardIds = cards.map((c) => c.id)
  const votesRes = cardIds.length > 0
    ? await supabase.from('votes').select('*').in('card_id', cardIds)
    : { data: [] }
  const votes = (votesRes.data ?? []) as Vote[]

  const participantMap: Record<string, string> = {}
  for (const p of participants) {
    participantMap[p.user_key] = p.display_name
  }

  const votesMap: Record<string, Vote[]> = {}
  for (const v of votes) {
    if (!votesMap[v.card_id]) votesMap[v.card_id] = []
    votesMap[v.card_id].push(v)
  }

  const markdown = exportMarkdown(session, cards, votesMap, participantMap)

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="retro-${sessionId.slice(0, 8)}.md"`,
    },
  })
}
