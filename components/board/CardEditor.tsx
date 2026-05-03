'use client'

import { useRef, useEffect } from 'react'

interface CardEditorProps {
  value: string
  placeholder?: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  onTyping?: () => void
}

export default function CardEditor({
  value, placeholder, onChange, onSave, onCancel, onTyping,
}: CardEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
    const len = ref.current?.value.length ?? 0
    ref.current?.setSelectionRange(len, len)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value)
        onTyping?.()
      }}
      onKeyDown={handleKeyDown}
      rows={3}
      className="w-full bg-[#EDEEE6] border border-[#2d1200]/25 rounded-lg px-3 py-2 text-[#2d1200] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#B83C28] focus:border-transparent placeholder-[#2d1200]/55 leading-relaxed"
    />
  )
}
