'use client'

import { getSupabaseClient } from '@/lib/supabase/client'
import { useBoardStore } from '@/store/boardStore'

interface FacilitatorControlsProps {
  sessionId: string
}

export default function FacilitatorControls({ sessionId }: FacilitatorControlsProps) {
  const session = useBoardStore((s) => s.session)
  const supabase = getSupabaseClient()

  if (!session) return null

  async function toggleReveal() {
    await supabase.from('sessions').update({ is_revealed: !session!.is_revealed }).eq('id', sessionId)
  }

  async function toggleLock() {
    await supabase.from('sessions').update({ is_locked: !session!.is_locked }).eq('id', sessionId)
  }

  function handleExport() {
    window.open(`/api/export/${sessionId}`, '_blank')
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleReveal}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
          session.is_revealed
            ? 'bg-[#B83C28]/20 border-[#B83C28]/50 text-[#B83C28]'
            : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
        }`}
      >
        {session.is_revealed ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Revealed
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Reveal cards
          </>
        )}
      </button>

      <button
        onClick={toggleLock}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
          session.is_locked
            ? 'bg-red-500/20 border-red-400/50 text-red-300'
            : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
        }`}
      >
        {session.is_locked ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Lock session
          </>
        )}
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
    </div>
  )
}
