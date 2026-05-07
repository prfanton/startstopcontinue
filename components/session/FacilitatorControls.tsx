'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useBoardStore } from '@/store/boardStore'

interface FacilitatorControlsProps {
  sessionId: string
}

const BTN = 'flex items-center gap-1.5 px-3 text-sm rounded-lg border font-medium transition-colors bg-white/40 backdrop-blur-sm border-[#2d1200]/20 text-[#2d1200] hover:bg-white/60'
const BTN_ACTIVE = 'flex items-center gap-1.5 px-3 text-sm rounded-lg border font-medium transition-colors bg-[#B83C28]/15 backdrop-blur-sm border-[#B83C28]/40 text-[#B83C28] hover:bg-[#B83C28]/25'

export default function FacilitatorControls({ sessionId }: FacilitatorControlsProps) {
  const session = useBoardStore((s) => s.session)
  const supabase = getSupabaseClient()

  // Timer state
  const DEFAULT_MINUTES = 5
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((s) => {
          if (s <= 1) { setRunning(false); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function adjustMinutes(delta: number) {
    setTotalSeconds((s) => Math.max(60, s + delta * 60))
  }

  function resetTimer() {
    setRunning(false)
    setTotalSeconds(DEFAULT_MINUTES * 60)
  }

  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  const isUrgent = totalSeconds <= 60 && totalSeconds > 0

  if (!session) return null

  async function toggleReveal() {
    await supabase.from('sessions').update({ is_revealed: !session!.is_revealed }).eq('id', sessionId)
  }

  function handleExport() {
    window.open(`/api/export/${sessionId}`, '_blank')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Timer */}
      <div className="flex items-center gap-1 bg-white/40 backdrop-blur-sm border border-[#2d1200]/20 rounded-lg px-2" style={{ height: '43px' }}>
        <button
          onClick={() => adjustMinutes(-1)}
          className="w-5 h-5 flex items-center justify-center text-[#2d1200]/60 hover:text-[#2d1200] font-bold text-base leading-none transition-colors"
          title="Remove 1 minute"
        >−</button>

        <button
          onClick={() => { if (totalSeconds > 0) setRunning((r) => !r) }}
          className={`mx-1 text-sm font-sans font-semibold w-12 text-center transition-colors ${
            isUrgent ? 'text-[#B83C28] animate-pulse' : 'text-[#2d1200]'
          }`}
          title={running ? 'Pause' : 'Start'}
        >
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </button>

        <button
          onClick={() => adjustMinutes(1)}
          className="w-5 h-5 flex items-center justify-center text-[#2d1200]/60 hover:text-[#2d1200] font-bold text-base leading-none transition-colors"
          title="Add 1 minute"
        >+</button>

        {/* Play/Pause icon */}
        <button
          onClick={() => { if (totalSeconds > 0) setRunning((r) => !r) }}
          className="ml-1 text-[#B83C28] hover:text-[#8a2a1a] transition-colors"
          title={running ? 'Pause' : 'Start'}
        >
          {running ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={resetTimer}
          className="ml-0.5 text-[#2d1200]/40 hover:text-[#2d1200]/70 transition-colors"
          title="Reset timer"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Reveal */}
      <button onClick={toggleReveal} style={{ height: '43px' }} className={session.is_revealed ? BTN_ACTIVE : BTN}>
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

      {/* Export */}
      <button onClick={handleExport} style={{ height: '43px' }} className={BTN}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
    </div>
  )
}
