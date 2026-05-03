interface PresenceAvatarProps {
  displayName: string
  size?: 'sm' | 'md'
  ringClass?: string
}

const COLORS = [
  'bg-pink-500', 'bg-purple-500', 'bg-blue-500',
  'bg-teal-500', 'bg-green-500', 'bg-orange-500',
  'bg-rose-500', 'bg-cyan-500',
]

function colorForName(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function PresenceAvatar({ displayName, size = 'md', ringClass = 'ring-[#ff6347]' }: PresenceAvatarProps) {
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'

  return (
    <div
      title={displayName}
      className={`${sizeClass} ${colorForName(displayName)} rounded-full flex items-center justify-center font-semibold text-white ring-2 ${ringClass} shrink-0`}
    >
      {initials || '?'}
    </div>
  )
}
