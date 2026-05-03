'use client'

import { useState, useEffect } from 'react'
import { getUserKey, getDisplayName, setDisplayName } from '@/lib/utils/userKey'
import { getFormat } from '@/lib/utils/sessionFormats'
import { useRetroChannel } from '@/lib/channels/useRetroChannel'
import { useBoardStore } from '@/store/boardStore'
import { usePresenceStore } from '@/store/presenceStore'
import { getSupabaseClient } from '@/lib/supabase/client'
import BoardColumn from './BoardColumn'
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
      <header className="border-b border-white/10 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <a href="/" className="title-animated text-white font-bold text-lg shrink-0 cursor-pointer select-none">
            {'Start Stop Continue'.split('').map((ch, i) => (
              <span
                key={i}
                className="title-letter"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {ch}
              </span>
            ))}
          </a>
          <span className="text-white/20">/</span>
          <h1 className="text-white font-semibold truncate">{session.title}</h1>
          {session.is_locked && (
            <span className="shrink-0 text-xs px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-400/30 rounded-full">
              Locked
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <PresenceBar />
          {isFacilitator && <FacilitatorControls sessionId={session.id} />}
          <InviteLinkButton />
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {!isLoaded ? (
          <div className="grid gap-4 md:grid-cols-3">
            {format.columns.map((col) => (
              <div key={col.id} className="border border-white/10 rounded-2xl p-4 animate-pulse h-48" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {format.columns.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                sessionId={session.id}
                userKey={userKey}
                displayName={displayName ?? ''}
                isRevealed={session.is_revealed}
                isLocked={session.is_locked}
                onBroadcastTyping={broadcastTyping}
                participants={participantMap}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
