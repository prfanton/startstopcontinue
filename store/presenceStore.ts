'use client'

import { create } from 'zustand'
import type { PresenceUser } from '@/types/retro'

interface PresenceStore {
  participants: PresenceUser[]
  typingCards: Record<string, { user_key: string; display_name: string }> // cardId → user
  setParticipants: (participants: PresenceUser[]) => void
  setTyping: (cardId: string, user: { user_key: string; display_name: string }) => void
  clearTyping: (cardId: string) => void
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  participants: [],
  typingCards: {},

  setParticipants: (participants) => set({ participants }),

  setTyping: (cardId, user) =>
    set((state) => ({ typingCards: { ...state.typingCards, [cardId]: user } })),

  clearTyping: (cardId) =>
    set((state) => {
      const { [cardId]: _, ...rest } = state.typingCards
      return { typingCards: rest }
    }),
}))
