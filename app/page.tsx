'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserKey } from '@/lib/utils/userKey'
import { FORMATS } from '@/lib/utils/sessionFormats'

export default function HomePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState('ssc')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const userKey = getUserKey()
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilitator_id: userKey,
          title: title.trim() || 'Team Retrospective',
          format,
        }),
      })
      if (!res.ok) throw new Error('Failed to create session')
      const session = await res.json()
      router.push(`/retro/${session.id}`)
    } catch {
      setError('Could not create session. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="animated-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#DFE0D8] mb-2">Start Stop Continue</h1>
          <p className="text-white/50 text-lg">Run better retrospectives with your team</p>
        </div>

        <div className="bg-[#DFE0D8] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-[#2d1200] mb-6">Create a new session</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2d1200]/70 mb-1">
                Session title <span className="text-[#2d1200]/55">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Team Retrospective"
                className="w-full px-4 py-2.5 bg-[#EDEEE6] border border-[#2d1200]/25 rounded-lg text-[#2d1200] placeholder-[#2d1200]/55 focus:outline-none focus:ring-2 focus:ring-[#B83C28] focus:border-transparent"
                maxLength={80}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d1200]/70 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#EDEEE6] border border-[#2d1200]/25 rounded-lg text-[#2d1200] focus:outline-none focus:ring-2 focus:ring-[#B83C28]"
              >
                {Object.values(FORMATS).map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 bg-[#B83C28] hover:bg-[#9c2e1a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Creating…' : 'Create Session'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          Have an invite link? Just open it directly.
        </p>
      </div>
    </main>
  )
}
