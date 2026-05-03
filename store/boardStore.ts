'use client'

import { create } from 'zustand'
import type { Session, Card, Vote } from '@/types/retro'

interface BoardStore {
  session: Session | null
  cards: Record<string, Card>
  votes: Record<string, Vote[]>       // keyed by card.id
  optimisticCards: Record<string, Card> // tempId → card
  isLoaded: boolean

  setSession: (session: Session) => void
  setCards: (cards: Card[]) => void
  setVotes: (votes: Vote[]) => void
  setLoaded: (loaded: boolean) => void

  applyCardUpsert: (card: Card) => void
  applyCardDelete: (id: string) => void
  applyVoteInsert: (vote: Vote) => void
  applyVoteDelete: (vote: { card_id: string; user_key: string }) => void

  addOptimisticCard: (card: Card) => void
  confirmOptimisticCard: (tempId: string, serverCard: Card) => void
  removeOptimisticCard: (tempId: string) => void
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  session: null,
  cards: {},
  votes: {},
  optimisticCards: {},
  isLoaded: false,

  setSession: (session) => set({ session }),
  setLoaded: (isLoaded) => set({ isLoaded }),

  setCards: (cards) => {
    const map: Record<string, Card> = {}
    for (const c of cards) map[c.id] = c
    set({ cards: map })
  },

  setVotes: (votes) => {
    const map: Record<string, Vote[]> = {}
    for (const v of votes) {
      if (!map[v.card_id]) map[v.card_id] = []
      map[v.card_id].push(v)
    }
    set({ votes: map })
  },

  applyCardUpsert: (card) => {
    const { optimisticCards } = get()
    // Check if this is confirming an optimistic card
    const tempId = Object.keys(optimisticCards).find((tid) => {
      const opt = optimisticCards[tid]
      return (
        opt.author_key === card.author_key &&
        opt.column_id === card.column_id &&
        opt.session_id === card.session_id &&
        Math.abs(new Date(opt.created_at).getTime() - new Date(card.created_at).getTime()) < 5000
      )
    })

    if (tempId) {
      set((state) => {
        const { [tempId]: _, ...rest } = state.optimisticCards
        return {
          cards: { ...state.cards, [card.id]: card },
          optimisticCards: rest,
        }
      })
    } else {
      set((state) => ({ cards: { ...state.cards, [card.id]: card } }))
    }
  },

  applyCardDelete: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.cards
      const { [id]: __, ...restVotes } = state.votes
      return { cards: rest, votes: restVotes }
    }),

  applyVoteInsert: (vote) =>
    set((state) => {
      const existing = state.votes[vote.card_id] ?? []
      if (existing.some((v) => v.user_key === vote.user_key)) return state
      return { votes: { ...state.votes, [vote.card_id]: [...existing, vote] } }
    }),

  applyVoteDelete: ({ card_id, user_key }) =>
    set((state) => ({
      votes: {
        ...state.votes,
        [card_id]: (state.votes[card_id] ?? []).filter((v) => v.user_key !== user_key),
      },
    })),

  addOptimisticCard: (card) =>
    set((state) => ({
      optimisticCards: { ...state.optimisticCards, [card.id]: card },
    })),

  confirmOptimisticCard: (tempId, serverCard) =>
    set((state) => {
      const { [tempId]: _, ...rest } = state.optimisticCards
      return {
        cards: { ...state.cards, [serverCard.id]: serverCard },
        optimisticCards: rest,
      }
    }),

  removeOptimisticCard: (tempId) =>
    set((state) => {
      const { [tempId]: _, ...rest } = state.optimisticCards
      return { optimisticCards: rest }
    }),
}))
