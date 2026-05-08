'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useBoardStore } from '@/store/boardStore'
import type { RetroFormat, Card, CardGroup } from '@/types/retro'

function trunc(text: string, max = 60) {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

// ─── Drag handle ─────────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <svg className="w-3.5 h-3.5 text-[#2d1200]/30 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/>
      <circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
      <circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
    </svg>
  )
}

// ─── Draggable ungrouped card ─────────────────────────────────────────────────

function SortableCard({ card, overlay = false }: { card: Card; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  })

  return (
    <div
      ref={setNodeRef}
      style={overlay ? undefined : { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attributes}
      className={`flex items-start gap-2 p-3 rounded-xl border bg-white/60 shadow-sm text-sm text-[#2d1200] leading-relaxed
        ${overlay ? 'shadow-lg rotate-1 border-[#B83C28]/40 bg-white/90' : 'border-[#2d1200]/10 hover:border-[#2d1200]/25 transition-colors'}
      `}
    >
      <span {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing touch-none">
        <DragHandle />
      </span>
      <span className="flex-1 whitespace-pre-wrap break-words">{card.content}</span>
    </div>
  )
}

// ─── Group stack (collapsed visual pile) ─────────────────────────────────────

function GroupStack({ group, cardCount, onOpen }: {
  group: CardGroup
  cardCount: number
  onOpen: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `group:${group.id}`,
    data: { type: 'group', group },
  })

  return (
    <div
      className={`relative select-none ${cardCount >= 3 ? 'mb-3' : cardCount >= 2 ? 'mb-2' : ''}`}
    >
      {/* Ghost card layers peeking below the main tile */}
      {cardCount >= 3 && (
        <div className="absolute -bottom-2 left-3 right-3 h-full rounded-xl border border-[#2d1200]/8 bg-white/35 pointer-events-none" />
      )}
      {cardCount >= 2 && (
        <div className="absolute -bottom-1 left-1.5 right-1.5 h-full rounded-xl border border-[#2d1200]/12 bg-white/50 pointer-events-none" />
      )}

      {/* Main group tile — droppable + clickable */}
      <div
        ref={setNodeRef}
        onClick={() => onOpen(group.id)}
        className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-colors
          ${isOver
            ? 'border-[#B83C28]/60 bg-[#B83C28]/6 shadow-md'
            : 'border-[#2d1200]/18 bg-white/82 hover:border-[#2d1200]/30 hover:bg-white/90'}
        `}
      >
        <svg className="w-3.5 h-3.5 text-[#2d1200]/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="flex-1 text-sm font-medium text-[#2d1200] truncate min-w-0">{group.name}</span>
        <span className="shrink-0 text-xs font-semibold text-white bg-[#2d1200]/35 rounded-full px-2 py-0.5 leading-5 min-w-[1.5rem] text-center">
          {cardCount}
        </span>
      </div>
    </div>
  )
}

// ─── Group dialog ─────────────────────────────────────────────────────────────

function GroupDialog({ group, cards, onClose, onRename, onDissolve, onRemoveFromGroup }: {
  group: CardGroup
  cards: Card[]
  onClose: () => void
  onRename: (id: string, name: string) => void
  onDissolve: (id: string) => void
  onRemoveFromGroup: (cardId: string) => void
}) {
  const [name, setName] = useState(group.name)

  // Stay in sync with external renames from other users
  useEffect(() => { setName(group.name) }, [group.name])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function commitRename() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== group.name) onRename(group.id, trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#FBF7F6] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#2d1200]/10">
          <div className="flex items-center gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { commitRename(); (e.target as HTMLInputElement).blur() }
              }}
              className="flex-1 min-w-0 text-base font-semibold text-[#2d1200] bg-transparent border-b-2 border-transparent hover:border-[#2d1200]/15 focus:border-[#B83C28] outline-none pb-0.5 transition-colors"
              placeholder="Group name"
            />
            <span className="shrink-0 text-xs text-[#2d1200]/40 font-medium">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Card list */}
        <div className="px-4 py-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
          {cards.map((card) => (
            <div key={card.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#2d1200]/10 bg-white/70">
              <p className="flex-1 text-sm text-[#2d1200] leading-relaxed">{card.content}</p>
              <button
                onClick={() => onRemoveFromGroup(card.id)}
                className="shrink-0 text-xs text-[#B83C28] hover:underline font-medium mt-0.5 transition-opacity"
              >
                Ungroup
              </button>
            </div>
          ))}
          {cards.length === 0 && (
            <p className="text-sm text-[#2d1200]/40 text-center py-4">No cards in this group.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2d1200]/10 flex items-center justify-between gap-3">
          <button
            onClick={() => { onDissolve(group.id); onClose() }}
            className="text-sm text-[#2d1200]/50 hover:text-[#B83C28] transition-colors font-medium"
          >
            Dissolve group
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#B83C28] hover:bg-[#9c2e1a] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Grouping column ──────────────────────────────────────────────────────────

const DOT_COLOR_MAP: Record<string, string> = {
  green: 'bg-green-400', red: 'bg-red-400', blue: 'bg-blue-400', yellow: 'bg-yellow-400',
}

function GroupingColumn({ columnId, columnLabel, columnColor, ungroupedCards, groups, cardsByGroup, onOpenGroup, isDropTarget }: {
  columnId: string
  columnLabel: string
  columnColor: string
  ungroupedCards: Card[]
  groups: CardGroup[]
  cardsByGroup: Record<string, Card[]>
  onOpenGroup: (id: string) => void
  isDropTarget: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${columnId}`,
    data: { type: 'column', columnId },
  })

  const totalCards = ungroupedCards.length + groups.reduce((s, g) => s + (cardsByGroup[g.id]?.length ?? 0), 0)
  const dotClass = DOT_COLOR_MAP[columnColor] ?? 'bg-blue-400'

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-48 rounded-2xl p-4 border border-white/50 bg-white/70 shadow-[0_4px_24px_rgba(45,18,0,0.10)] transition-colors
        ${isOver && isDropTarget ? 'border-[#B83C28]/40 bg-[#B83C28]/4' : ''}
      `}
      style={{ backdropFilter: 'blur(18px)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <h3 className="font-semibold text-base text-[#2d1200] truncate">{columnLabel}</h3>
        <span className="ml-auto text-xs text-[#2d1200]/60 font-medium shrink-0">{totalCards}</span>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {groups.map((group) => (
          <GroupStack
            key={group.id}
            group={group}
            cardCount={cardsByGroup[group.id]?.length ?? 0}
            onOpen={onOpenGroup}
          />
        ))}

        <SortableContext items={ungroupedCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {ungroupedCards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

// ─── Main board ───────────────────────────────────────────────────────────────

interface GroupingBoardProps {
  format: RetroFormat
  sessionId: string
}

export default function GroupingBoard({ format, sessionId }: GroupingBoardProps) {
  const supabase = getSupabaseClient()
  const allCards = useBoardStore((s) => s.cards)
  const allGroups = useBoardStore((s) => s.groups)
  const applyCardUpsert = useBoardStore((s) => s.applyCardUpsert)
  const applyGroupUpsert = useBoardStore((s) => s.applyGroupUpsert)
  const applyGroupDelete = useBoardStore((s) => s.applyGroupDelete)

  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  // MouseSensor: start drag after 5px movement (desktop)
  // TouchSensor: start drag after 200ms press + 8px tolerance (mobile, avoids scroll conflict)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const sessionCards = useMemo(
    () => Object.values(allCards).filter((c) => c.session_id === sessionId),
    [allCards, sessionId],
  )
  const sessionGroups = useMemo(
    () => Object.values(allGroups).filter((g) => g.session_id === sessionId),
    [allGroups, sessionId],
  )

  const ungroupedByColumn = useMemo(() => {
    const map: Record<string, Card[]> = {}
    for (const col of format.columns) {
      map[col.id] = sessionCards
        .filter((c) => c.column_id === col.id && !c.group_id)
        .sort((a, b) => a.position - b.position)
    }
    return map
  }, [sessionCards, format.columns])

  const groupsByColumn = useMemo(() => {
    const map: Record<string, CardGroup[]> = {}
    for (const col of format.columns) {
      map[col.id] = sessionGroups
        .filter((g) => g.column_id === col.id)
        .sort((a, b) => a.position - b.position)
    }
    return map
  }, [sessionGroups, format.columns])

  const cardsByGroup = useMemo(() => {
    const map: Record<string, Card[]> = {}
    for (const g of sessionGroups) {
      map[g.id] = sessionCards.filter((c) => c.group_id === g.id).sort((a, b) => a.position - b.position)
    }
    return map
  }, [sessionCards, sessionGroups])

  function resolveColumnId(overId: string): string | null {
    if (overId.startsWith('col:')) return overId.slice(4)
    if (overId.startsWith('group:')) return allGroups[overId.slice(6)]?.column_id ?? null
    return allCards[overId]?.column_id ?? null
  }

  function onDragStart({ active }: DragStartEvent) {
    const data = active.data.current
    if (data?.type === 'card') setActiveCard(data.card as Card)
  }

  function onDragOver({ over }: DragOverEvent) {
    setOverColumnId(over ? resolveColumnId(String(over.id)) : null)
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null)
    setOverColumnId(null)
    if (!over || active.id === over.id) return

    const activeData = active.data.current
    if (activeData?.type !== 'card') return

    const draggedCard = activeData.card as Card
    const overId = String(over.id)
    const overData = over.data.current

    // ── Drop onto a group stack ──
    if (overId.startsWith('group:')) {
      const groupId = overId.slice(6)
      const group = allGroups[groupId]
      if (!group || draggedCard.group_id === groupId) return
      applyCardUpsert({ ...draggedCard, group_id: groupId, column_id: group.column_id })
      void supabase.from('cards').update({ group_id: groupId, column_id: group.column_id }).eq('id', draggedCard.id)
      return
    }

    // ── Drop onto column empty area ──
    if (overId.startsWith('col:')) {
      const targetColId = overId.slice(4)
      if (!draggedCard.group_id && draggedCard.column_id === targetColId) return
      applyCardUpsert({ ...draggedCard, group_id: null, column_id: targetColId })
      void supabase.from('cards').update({ group_id: null, column_id: targetColId }).eq('id', draggedCard.id)
      return
    }

    // ── Drop onto another card ──
    if (overData?.type === 'card') {
      const targetCard = overData.card as Card
      if (targetCard.id === draggedCard.id) return

      // Target already in a group → join it
      if (targetCard.group_id) {
        const group = allGroups[targetCard.group_id]
        if (!group) return
        applyCardUpsert({ ...draggedCard, group_id: targetCard.group_id, column_id: group.column_id })
        void supabase.from('cards').update({ group_id: targetCard.group_id, column_id: group.column_id }).eq('id', draggedCard.id)
        return
      }

      // Both ungrouped → create new group
      // Use client-generated UUID so optimistic updates are immediate
      const newGroupId = crypto.randomUUID()
      const targetColId = targetCard.column_id
      const groupName = trunc(targetCard.content)
      const position = (groupsByColumn[targetColId] ?? []).length
      const now = new Date().toISOString()

      applyGroupUpsert({ id: newGroupId, session_id: sessionId, column_id: targetColId, name: groupName, position, created_at: now })
      applyCardUpsert({ ...draggedCard, group_id: newGroupId, column_id: targetColId })
      applyCardUpsert({ ...targetCard, group_id: newGroupId })

      // Fire all DB writes in parallel — don't block UI
      await Promise.all([
        supabase.from('groups').insert({ id: newGroupId, session_id: sessionId, column_id: targetColId, name: groupName, position }),
        supabase.from('cards').update({ group_id: newGroupId, column_id: targetColId }).eq('id', draggedCard.id),
        supabase.from('cards').update({ group_id: newGroupId }).eq('id', targetCard.id),
      ])
    }
  }

  const handleRenameGroup = useCallback(async (groupId: string, name: string) => {
    const group = allGroups[groupId]
    if (!group) return
    applyGroupUpsert({ ...group, name })
    void supabase.from('groups').update({ name }).eq('id', groupId)
  }, [allGroups, applyGroupUpsert, supabase])

  const handleDissolveGroup = useCallback(async (groupId: string) => {
    const group = allGroups[groupId]
    if (!group) return
    for (const card of cardsByGroup[groupId] ?? []) {
      applyCardUpsert({ ...card, group_id: null })
    }
    applyGroupDelete(groupId)
    await Promise.all([
      supabase.from('cards').update({ group_id: null }).eq('group_id', groupId),
      supabase.from('groups').delete().eq('id', groupId),
    ])
  }, [allGroups, cardsByGroup, applyCardUpsert, applyGroupDelete, supabase])

  const handleRemoveFromGroup = useCallback(async (cardId: string) => {
    const card = allCards[cardId]
    if (!card?.group_id) return
    applyCardUpsert({ ...card, group_id: null })
    void supabase.from('cards').update({ group_id: null }).eq('id', cardId)
  }, [allCards, applyCardUpsert, supabase])

  const openGroup = openGroupId ? allGroups[openGroupId] : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <p className="mb-3 flex items-center gap-2 text-xs text-[#2d1200]/50">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Drag cards onto each other to group them. Tap a group to view and manage its cards.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {format.columns.map((col) => (
            <GroupingColumn
              key={col.id}
              columnId={col.id}
              columnLabel={col.label}
              columnColor={col.color}
              ungroupedCards={ungroupedByColumn[col.id] ?? []}
              groups={groupsByColumn[col.id] ?? []}
              cardsByGroup={cardsByGroup}
              onOpenGroup={setOpenGroupId}
              isDropTarget={overColumnId === col.id}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard && <SortableCard card={activeCard} overlay />}
        </DragOverlay>
      </DndContext>

      {openGroup && (
        <GroupDialog
          group={openGroup}
          cards={cardsByGroup[openGroup.id] ?? []}
          onClose={() => setOpenGroupId(null)}
          onRename={handleRenameGroup}
          onDissolve={handleDissolveGroup}
          onRemoveFromGroup={handleRemoveFromGroup}
        />
      )}
    </>
  )
}
