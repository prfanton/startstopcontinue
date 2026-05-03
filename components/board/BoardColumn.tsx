'use client'

import { useBoardStore } from '@/store/boardStore'
import RetroCard from './RetroCard'
import AddCardButton from './AddCardButton'
import type { ColumnDef } from '@/types/retro'

const BORDER_COLOR_MAP: Record<string, string> = {
  green:  'border-white/25',
  red:    'border-white/25',
  blue:   'border-white/25',
  yellow: 'border-white/25',
}

const HEADER_COLOR_MAP: Record<string, string> = {
  green:  'text-white',
  red:    'text-white',
  blue:   'text-white',
  yellow: 'text-white',
}

const DOT_COLOR_MAP: Record<string, string> = {
  green:  'bg-green-400',
  red:    'bg-red-400',
  blue:   'bg-blue-400',
  yellow: 'bg-yellow-400',
}

interface BoardColumnProps {
  column: ColumnDef
  sessionId: string
  userKey: string
  displayName: string
  isRevealed: boolean
  isLocked: boolean
  onBroadcastTyping: (cardId: string) => void
  participants: Record<string, string>
}

export default function BoardColumn({
  column, sessionId, userKey, displayName, isRevealed, isLocked, onBroadcastTyping, participants,
}: BoardColumnProps) {
  const allCards = useBoardStore((s) => s.cards)
  const optimisticCards = useBoardStore((s) => s.optimisticCards)
  const votes = useBoardStore((s) => s.votes)

  const colCards = [
    ...Object.values(allCards),
    ...Object.values(optimisticCards),
  ]
    .filter((c) => c.column_id === column.id && c.session_id === sessionId)
    .sort((a, b) => a.position - b.position)

  const borderClass = BORDER_COLOR_MAP[column.color] ?? BORDER_COLOR_MAP.blue
  const headerClass = HEADER_COLOR_MAP[column.color] ?? 'text-blue-400'
  const dotClass = DOT_COLOR_MAP[column.color] ?? 'bg-blue-400'

  return (
    <div className={`flex flex-col min-w-0 rounded-2xl p-4 border ${borderClass} bg-white/10 backdrop-blur-md shadow-lg`} style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
        <h3 className={`font-semibold text-base ${headerClass}`}>{column.label}</h3>
        <span className="ml-auto text-xs text-white/60 font-medium">{colCards.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1">
        {colCards.map((card) => (
          <RetroCard
            key={card.id}
            card={card}
            votes={votes[card.id] ?? []}
            userKey={userKey}
            isRevealed={isRevealed}
            isLocked={isLocked}
            displayName={displayName}
            onBroadcastTyping={onBroadcastTyping}
            participants={participants}
          />
        ))}

        {!isLocked && (
          <AddCardButton
            sessionId={sessionId}
            columnId={column.id}
            userKey={userKey}
            displayName={displayName}
            placeholder={column.placeholder}
            onBroadcastTyping={onBroadcastTyping}
          />
        )}
      </div>
    </div>
  )
}
