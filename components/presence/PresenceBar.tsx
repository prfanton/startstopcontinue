'use client'

import { usePresenceStore } from '@/store/presenceStore'
import PresenceAvatar from './PresenceAvatar'

const MAX_SHOWN = 5

export default function PresenceBar() {
  const participants = usePresenceStore((s) => s.participants)

  if (participants.length === 0) return null

  const shown = participants.slice(0, MAX_SHOWN)
  const extra = participants.length - MAX_SHOWN

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <PresenceAvatar key={p.user_key} displayName={p.display_name} />
        ))}
      </div>
      {extra > 0 && (
        <span className="text-slate-400 text-xs ml-2">+{extra} more</span>
      )}
    </div>
  )
}
