'use client'

import { useMemo } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useBoardStore } from '@/store/boardStore'
import type { RetroFormat, Card, CardGroup } from '@/types/retro'

const DOT_COLOR_MAP: Record<string, string> = {
  green: 'bg-green-400', red: 'bg-red-400', blue: 'bg-blue-400', yellow: 'bg-yellow-400',
}

interface VotingBoardProps {
  format: RetroFormat
  sessionId: string
  userKey: string
}

// ─── Vote button ──────────────────────────────────────────────────────────────

function VoteButton({ count, hasVoted, onVote }: { count: number; hasVoted: boolean; onVote: () => void }) {
  return (
    <button
      onClick={onVote}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
        hasVoted
          ? 'bg-[#B83C28] text-white'
          : 'bg-[#2d1200]/8 text-[#2d1200]/65 hover:bg-[#2d1200]/15 hover:text-[#2d1200]'
      }`}
    >
      <svg className="w-3 h-3" fill={hasVoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
      {count}
    </button>
  )
}

// ─── Group item ───────────────────────────────────────────────────────────────

function GroupItem({ group, cards, userKey }: { group: CardGroup; cards: Card[]; userKey: string }) {
  const supabase = getSupabaseClient()
  const votes = useBoardStore((s) => s.votes)
  const applyVoteInsert = useBoardStore((s) => s.applyVoteInsert)
  const applyVoteDelete = useBoardStore((s) => s.applyVoteDelete)

  const totalVotes = cards.reduce((s, c) => s + (votes[c.id]?.length ?? 0), 0)
  const hasVoted = cards.some((c) => votes[c.id]?.some((v) => v.user_key === userKey))
  // Proxy card: first card by position for storing the group vote
  const proxyCard = cards.slice().sort((a, b) => a.position - b.position)[0]

  async function handleVote() {
    if (!proxyCard) return
    if (hasVoted) {
      // Remove votes from all cards in the group that this user voted on
      for (const card of cards) {
        const userVote = votes[card.id]?.find((v) => v.user_key === userKey)
        if (userVote) {
          applyVoteDelete({ card_id: card.id, user_key: userKey })
          await supabase.from('votes').delete().eq('card_id', card.id).eq('user_key', userKey)
        }
      }
    } else {
      const newVote = { id: crypto.randomUUID(), card_id: proxyCard.id, user_key: userKey, created_at: new Date().toISOString() }
      applyVoteInsert(newVote)
      await supabase.from('votes').insert({ card_id: proxyCard.id, user_key: userKey })
    }
  }

  return (
    <div className="rounded-xl border-2 border-[#2d1200]/12 bg-[#2d1200]/3 p-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-3.5 h-3.5 text-[#2d1200]/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="flex-1 text-xs font-semibold text-[#2d1200]/80 truncate">{group.name}</span>
        <VoteButton count={totalVotes} hasVoted={hasVoted} onVote={handleVote} />
      </div>
      <div className="flex flex-col gap-1.5">
        {cards.map((card) => (
          <div key={card.id} className="px-2.5 py-2 rounded-lg bg-white/50 border border-[#2d1200]/8 text-sm text-[#2d1200] leading-relaxed">
            {card.content}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Ungrouped card item ──────────────────────────────────────────────────────

function CardItem({ card, userKey }: { card: Card; userKey: string }) {
  const supabase = getSupabaseClient()
  const votes = useBoardStore((s) => s.votes)
  const applyVoteInsert = useBoardStore((s) => s.applyVoteInsert)
  const applyVoteDelete = useBoardStore((s) => s.applyVoteDelete)

  const cardVotes = votes[card.id] ?? []
  const hasVoted = cardVotes.some((v) => v.user_key === userKey)
  const voteCount = cardVotes.length

  async function handleVote() {
    if (hasVoted) {
      applyVoteDelete({ card_id: card.id, user_key: userKey })
      await supabase.from('votes').delete().eq('card_id', card.id).eq('user_key', userKey)
    } else {
      const newVote = { id: crypto.randomUUID(), card_id: card.id, user_key: userKey, created_at: new Date().toISOString() }
      applyVoteInsert(newVote)
      await supabase.from('votes').insert({ card_id: card.id, user_key: userKey })
    }
  }

  return (
    <div className="flex items-start gap-2 p-3 rounded-xl border border-[#2d1200]/10 bg-white/60 shadow-sm">
      <p className="flex-1 text-sm text-[#2d1200] leading-relaxed whitespace-pre-wrap break-words">{card.content}</p>
      <VoteButton count={voteCount} hasVoted={hasVoted} onVote={handleVote} />
    </div>
  )
}

// ─── Column ───────────────────────────────────────────────────────────────────

function VotingColumn({ columnId, columnLabel, columnColor, sessionId, userKey }: {
  columnId: string
  columnLabel: string
  columnColor: string
  sessionId: string
  userKey: string
}) {
  const allCards = useBoardStore((s) => s.cards)
  const allGroups = useBoardStore((s) => s.groups)

  const sessionCards = useMemo(
    () => Object.values(allCards).filter((c) => c.session_id === sessionId && c.column_id === columnId),
    [allCards, sessionId, columnId]
  )

  const groups = useMemo(
    () => Object.values(allGroups)
      .filter((g) => g.session_id === sessionId && g.column_id === columnId)
      .sort((a, b) => a.position - b.position),
    [allGroups, sessionId, columnId]
  )

  const cardsByGroup = useMemo(() => {
    const map: Record<string, Card[]> = {}
    for (const g of groups) {
      map[g.id] = sessionCards.filter((c) => c.group_id === g.id).sort((a, b) => a.position - b.position)
    }
    return map
  }, [groups, sessionCards])

  const ungroupedCards = useMemo(
    () => sessionCards.filter((c) => !c.group_id).sort((a, b) => a.position - b.position),
    [sessionCards]
  )

  const dotClass = DOT_COLOR_MAP[columnColor] ?? 'bg-blue-400'
  const totalItems = groups.length + ungroupedCards.length

  return (
    <div
      className="flex flex-col min-w-0 rounded-2xl p-4 border border-white/40 bg-white/20 shadow-[0_4px_24px_rgba(45,18,0,0.10),0_1px_4px_rgba(45,18,0,0.06)]"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
        <h3 className="font-semibold text-base text-[#2d1200]">{columnLabel}</h3>
        <span className="ml-auto text-xs text-[#2d1200]/60 font-medium">{totalItems}</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {groups.map((group) => (
          <GroupItem
            key={group.id}
            group={group}
            cards={cardsByGroup[group.id] ?? []}
            userKey={userKey}
          />
        ))}
        {ungroupedCards.map((card) => (
          <CardItem key={card.id} card={card} userKey={userKey} />
        ))}
        {totalItems === 0 && (
          <p className="text-xs text-[#2d1200]/30 text-center py-4">No cards</p>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function VotingBoard({ format, sessionId, userKey }: VotingBoardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {format.columns.map((col) => (
        <VotingColumn
          key={col.id}
          columnId={col.id}
          columnLabel={col.label}
          columnColor={col.color}
          sessionId={sessionId}
          userKey={userKey}
        />
      ))}
    </div>
  )
}
