'use client'

import { useState } from 'react'

interface JoinModalProps {
  onJoin: (displayName: string) => void
}

export default function JoinModal({ onJoin }: JoinModalProps) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onJoin(trimmed)
  }

  return (
    <div className="fixed inset-0 bg-[#2d1200]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-white/50">
        <h2 className="text-2xl font-bold text-[#2d1200] mb-2">What's your name?</h2>
        <p className="text-[#2d1200]/60 mb-6 text-sm">Let teammates know who you are.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            className="w-full px-4 py-3 bg-[#EDEEE6] border border-[#2d1200]/25 rounded-lg text-[#2d1200] placeholder-[#2d1200]/55 focus:outline-none focus:ring-2 focus:ring-[#B83C28]"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-[#B83C28] hover:bg-[#9c2e1a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            Join Session
          </button>
        </form>
      </div>
    </div>
  )
}
