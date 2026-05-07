'use client'

import { useState, useMemo, useEffect } from 'react'
import { useBoardStore } from '@/store/boardStore'
import type { RetroFormat, Card } from '@/types/retro'

interface ResultsViewProps {
  format: RetroFormat
  sessionId: string
  userKey: string
  onExport: () => void
}

export default function ResultsView({ format, sessionId, onExport }: ResultsViewProps) {
  const allCards = useBoardStore((s) => s.cards)
  const allGroups = useBoardStore((s) => s.groups)
  const votes = useBoardStore((s) => s.votes)
  const [activeIndex, setActiveIndex] = useState(0)

  const sessionCards = useMemo(
    () => Object.values(allCards).filter((c) => c.session_id === sessionId),
    [allCards, sessionId]
  )

  const sessionGroups = useMemo(
    () => Object.values(allGroups).filter((g) => g.session_id === sessionId),
    [allGroups, sessionId]
  )

  // Total votes for a column = sum of votes across all cards in that column
  const columnTotals = useMemo(() => {
    const map: Record<string, number> = {}
    for (const col of format.columns) {
      map[col.id] = sessionCards
        .filter((c) => c.column_id === col.id)
        .reduce((sum, c) => sum + (votes[c.id]?.length ?? 0), 0)
    }
    return map
  }, [format.columns, sessionCards, votes])

  // Columns sorted by total votes descending
  const sortedColumns = useMemo(
    () => [...format.columns].sort((a, b) => (columnTotals[b.id] ?? 0) - (columnTotals[a.id] ?? 0)),
    [format.columns, columnTotals]
  )

  const activeColumn = sortedColumns[activeIndex]

  // Build the display items for the active column: groups first (sorted by group total votes), then ungrouped cards
  const activeItems = useMemo(() => {
    if (!activeColumn) return []

    const colCards = sessionCards.filter((c) => c.column_id === activeColumn.id)
    const colGroups = sessionGroups.filter((g) => g.column_id === activeColumn.id)

    type DisplayItem =
      | { kind: 'group'; groupId: string; groupName: string; cards: Card[]; totalVotes: number }
      | { kind: 'card'; card: Card; voteCount: number }

    const items: DisplayItem[] = []

    // Groups with their cards, sorted by group total votes desc
    const groupItems = colGroups.map((g) => {
      const cards = colCards.filter((c) => c.group_id === g.id).sort((a, b) => (votes[b.id]?.length ?? 0) - (votes[a.id]?.length ?? 0))
      const totalVotes = cards.reduce((s, c) => s + (votes[c.id]?.length ?? 0), 0)
      return { kind: 'group' as const, groupId: g.id, groupName: g.name, cards, totalVotes }
    }).sort((a, b) => b.totalVotes - a.totalVotes)

    // Ungrouped cards sorted by votes desc
    const ungroupedItems = colCards
      .filter((c) => !c.group_id)
      .sort((a, b) => (votes[b.id]?.length ?? 0) - (votes[a.id]?.length ?? 0))
      .map((card) => ({ kind: 'card' as const, card, voteCount: votes[card.id]?.length ?? 0 }))

    items.push(...groupItems, ...ungroupedItems)
    return items
  }, [activeColumn, sessionCards, sessionGroups, votes])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setActiveIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setActiveIndex((i) => Math.min(sortedColumns.length - 1, i + 1))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [sortedColumns.length])

  const DOT_COLOR_MAP: Record<string, string> = {
    green: 'bg-green-400', red: 'bg-red-400', blue: 'bg-blue-400', yellow: 'bg-yellow-400',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {sortedColumns.map((col, idx) => (
          <button
            key={col.id}
            onClick={() => setActiveIndex(idx)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              idx === activeIndex
                ? 'bg-[#B83C28] text-white border-[#B83C28]'
                : 'bg-white/60 text-[#2d1200] border-[#2d1200]/15 hover:bg-white/80'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${DOT_COLOR_MAP[col.color] ?? 'bg-blue-400'}`} />
            {col.label}
            <span className={`text-xs ${idx === activeIndex ? 'text-white/80' : 'text-[#2d1200]/50'}`}>
              {columnTotals[col.id]}▲
            </span>
          </button>
        ))}
      </div>

      {/* Focused column */}
      {activeColumn && (
        <div className="rounded-2xl border border-white/50 bg-white/70 shadow-[0_4px_24px_rgba(45,18,0,0.10)] p-6" style={{ backdropFilter: 'blur(18px)' }}>
          {/* Column header + navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="p-2 rounded-lg text-[#2d1200]/40 hover:text-[#2d1200] hover:bg-[#2d1200]/8 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${DOT_COLOR_MAP[activeColumn.color] ?? 'bg-blue-400'}`} />
              <h2 className="font-semibold text-[#2d1200] text-lg">{activeColumn.label}</h2>
              <span className="text-sm text-[#2d1200]/50">
                — {columnTotals[activeColumn.id]} vote{columnTotals[activeColumn.id] !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-[#2d1200]/40 ml-1">
                ({activeIndex + 1} of {sortedColumns.length})
              </span>
            </div>

            <button
              onClick={() => setActiveIndex((i) => Math.min(sortedColumns.length - 1, i + 1))}
              disabled={activeIndex === sortedColumns.length - 1}
              className="p-2 rounded-lg text-[#2d1200]/40 hover:text-[#2d1200] hover:bg-[#2d1200]/8 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Items */}
          {activeItems.length === 0 ? (
            <p className="text-center text-[#2d1200]/40 text-sm py-8">No cards in this group</p>
          ) : (
            <div className="flex flex-col gap-3 max-w-2xl mx-auto">
              {activeItems.map((item) => {
                if (item.kind === 'group') {
                  return (
                    <div key={item.groupId} className="rounded-xl border border-[#2d1200]/15 bg-[#2d1200]/3 p-3.5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <svg className="w-3.5 h-3.5 text-[#2d1200]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-xs font-semibold text-[#2d1200]/70">{item.groupName}</span>
                        <span className="text-xs text-[#2d1200]/40">{item.cards.length} cards · {item.totalVotes}▲</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {item.cards.map((card) => {
                          const vc = votes[card.id]?.length ?? 0
                          return (
                            <div key={card.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-[#2d1200]/8 bg-white/50">
                              <div className="flex items-center justify-center min-w-[1.75rem] h-7 rounded-full bg-[#B83C28]/10 text-[#B83C28] text-xs font-semibold">
                                {vc}
                              </div>
                              <p className="flex-1 text-sm text-[#2d1200] leading-relaxed whitespace-pre-wrap break-words">{card.content}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                // Ungrouped card
                return (
                  <div key={item.card.id} className="flex items-start gap-3 p-4 rounded-xl border border-[#2d1200]/10 bg-white/50">
                    <div className="flex items-center justify-center min-w-[2rem] h-8 rounded-full bg-[#B83C28]/10 text-[#B83C28] text-sm font-semibold">
                      {item.voteCount}
                    </div>
                    <p className="flex-1 text-sm text-[#2d1200] leading-relaxed whitespace-pre-wrap break-words">{item.card.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Export */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B83C28] text-white font-medium text-sm hover:bg-[#9a3121] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export as Markdown
        </button>
      </div>
    </div>
  )
}
