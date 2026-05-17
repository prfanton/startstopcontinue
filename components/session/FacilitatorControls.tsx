'use client'

import { useState, useEffect, useRef } from 'react'
import { useBoardStore } from '@/store/boardStore'

export default function FacilitatorControls() {
  const session = useBoardStore((s) => s.session)

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

  return (
    <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm border border-[#2d1200]/20 rounded-xl px-3 py-1.5">
      <button
        onClick={() => adjustMinutes(-1)}
        className="w-8 h-8 flex items-center justify-center text-[#2d1200]/60 hover:text-[#2d1200] hover:bg-[#2d1200]/10 font-bold text-lg rounded-lg transition-colors"
        title="Remove 1 minute"
      >−</button>

      <button
        onClick={() => { if (totalSeconds > 0) setRunning((r) => !r) }}
        className={`text-base font-sans font-semibold w-14 text-center transition-colors ${
          isUrgent ? 'text-[#B83C28] animate-pulse' : 'text-[#2d1200]'
        }`}
        title={running ? 'Pause' : 'Start'}
      >
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </button>

      <button
        onClick={() => adjustMinutes(1)}
        className="w-8 h-8 flex items-center justify-center text-[#2d1200]/60 hover:text-[#2d1200] hover:bg-[#2d1200]/10 font-bold text-lg rounded-lg transition-colors"
        title="Add 1 minute"
      >+</button>

      <button
        onClick={() => { if (totalSeconds > 0) setRunning((r) => !r) }}
        className="w-8 h-8 flex items-center justify-center text-[#B83C28] hover:text-[#8a2a1a] hover:bg-[#B83C28]/10 rounded-lg transition-colors"
        title={running ? 'Pause' : 'Start'}
      >
        {running ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      <button
        onClick={resetTimer}
        className="w-8 h-8 flex items-center justify-center text-[#2d1200]/40 hover:text-[#2d1200]/70 hover:bg-[#2d1200]/10 rounded-lg transition-colors"
        title="Reset timer"
      >
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  )
}
