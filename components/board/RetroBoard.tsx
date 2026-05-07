'use client'

import { useState, useEffect } from 'react'
import { getUserKey, getDisplayName, setDisplayName } from '@/lib/utils/userKey'
import { getFormat } from '@/lib/utils/sessionFormats'
import { getPhaseCapabilities } from '@/lib/utils/phaseUtils'
import { useRetroChannel } from '@/lib/channels/useRetroChannel'
import { useBoardStore } from '@/store/boardStore'
import { usePresenceStore } from '@/store/presenceStore'
import { getSupabaseClient } from '@/lib/supabase/client'
import BoardColumn from './BoardColumn'
import GroupingBoard from './GroupingBoard'
import ResultsView from './ResultsView'
import WorkflowBreadcrumb from './WorkflowBreadcrumb'
import JoinModal from '@/components/session/JoinModal'
import InviteLinkButton from '@/components/session/InviteLinkButton'
import FacilitatorControls from '@/components/session/FacilitatorControls'
import PresenceBar from '@/components/presence/PresenceBar'
import type { Session } from '@/types/retro'

interface RetroBoardProps {
  session: Session
}

export default function RetroBoard({ session: initialSession }: RetroBoardProps) {
  const [userKey] = useState(() => getUserKey())
  const [displayName, setDisplayNameState] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const boardSession = useBoardStore((s) => s.session)
  const setSession = useBoardStore((s) => s.setSession)
  const isLoaded = useBoardStore((s) => s.isLoaded)
  const participants = usePresenceStore((s) => s.participants)

  useEffect(() => {
    setSession(initialSession)
    setMounted(true)
    const storedName = getDisplayName(initialSession.id)
    setDisplayNameState(storedName)
  }, [initialSession, setSession])

  const session = boardSession ?? initialSession
  const format = getFormat(session.format)
  const isFacilitator = session.facilitator_id === userKey
  const phase = session.phase ?? 'writing'
  const capabilities = getPhaseCapabilities(phase)

  const participantMap: Record<string, string> = {}
  for (const p of participants) {
    participantMap[p.user_key] = p.display_name
  }

  const { broadcastTyping } = useRetroChannel({
    sessionId: session.id,
    userKey,
    displayName: displayName ?? '',
  })

  async function handleJoin(name: string) {
    setDisplayName(session.id, name)
    setDisplayNameState(name)
    const supabase = getSupabaseClient()
    await supabase
      .from('participants')
      .upsert(
        { session_id: session.id, user_key: userKey, display_name: name },
        { onConflict: 'session_id,user_key' }
      )
  }

  function handleExport() {
    window.open(`/api/export/${session.id}`, '_blank')
  }

  if (!mounted) {
    return (
      <div className="animated-bg min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B83C28] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animated-bg min-h-screen flex flex-col">
      {!displayName && <JoinModal onJoin={handleJoin} />}

      {/* Header */}
      <header className="px-4 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <a href="/" className="shrink-0 hover:opacity-80 transition-opacity">
              <img
                src="/logo-espresso-retro-horizontal.png"
                alt="Espresso Retro"
                className="h-20 w-auto"
              />
            </a>
            <span className="text-[#2d1200]/30">/</span>
            <h1 className="text-[#2d1200] font-semibold truncate">{session.title}</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <PresenceBar />
            {!isFacilitator && (
              <div className="bg-white/40 backdrop-blur-sm border border-[#2d1200]/20 rounded-lg px-3" style={{ height: '43px', display: 'flex', alignItems: 'center' }}>
                <WorkflowBreadcrumb phase={phase} isFacilitator={false} />
              </div>
            )}
            {isFacilitator && <FacilitatorControls sessionId={session.id} />}
            <InviteLinkButton />
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-[1200px] mx-auto">
          {!isLoaded ? (
            <div className="grid gap-4 md:grid-cols-3">
              {format.columns.map((col) => (
                <div key={col.id} className="border border-[#2d1200]/15 rounded-2xl p-4 animate-pulse h-48" />
              ))}
            </div>
          ) : phase === 'results' ? (
            <ResultsView
              format={format}
              sessionId={session.id}
              userKey={userKey}
              onExport={handleExport}
            />
          ) : phase === 'grouping' ? (
            <GroupingBoard format={format} sessionId={session.id} />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {format.columns.map((col) => (
                <BoardColumn
                  key={col.id}
                  column={col}
                  sessionId={session.id}
                  userKey={userKey}
                  displayName={displayName ?? ''}
                  isRevealed={capabilities.isRevealed}
                  isLocked={!capabilities.canAddCards}
                  canVote={capabilities.canVote}
                  onBroadcastTyping={broadcastTyping}
                  participants={participantMap}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
