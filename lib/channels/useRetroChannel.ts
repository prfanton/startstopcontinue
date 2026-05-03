'use client'

import { useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useBoardStore } from '@/store/boardStore'
import { usePresenceStore } from '@/store/presenceStore'
import type { Card, Vote, Session, PresenceUser } from '@/types/retro'

interface UseRetroChannelOptions {
  sessionId: string
  userKey: string
  displayName: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = { new: any; old: any; payload: any }

export function useRetroChannel({ sessionId, userKey, displayName }: UseRetroChannelOptions) {
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null>(null)
  const {
    setSession, setCards, setVotes, setLoaded,
    applyCardUpsert, applyCardDelete,
    applyVoteInsert, applyVoteDelete,
  } = useBoardStore.getState()
  const { setParticipants, setTyping, clearTyping } = usePresenceStore.getState()

  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  async function fetchInitialData() {
    const supabase = getSupabaseClient()
    const cardsRes = await supabase.from('cards').select('*').eq('session_id', sessionId)
    const cards = (cardsRes.data ?? []) as Card[]
    setCards(cards)

    const cardIds = cards.map((c) => c.id)
    if (cardIds.length > 0) {
      const votesRes = await supabase.from('votes').select('*').in('card_id', cardIds)
      if (votesRes.data) setVotes(votesRes.data as Vote[])
    } else {
      setVotes([])
    }
    setLoaded(true)
  }

  useEffect(() => {
    if (!sessionId || !userKey || !displayName) return

    const supabase = getSupabaseClient()
    const channelName = `retro:${sessionId}`

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userKey } },
    })

    channelRef.current = channel

    // Postgres Changes: cards
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'cards', filter: `session_id=eq.${sessionId}` },
      (payload: AnyPayload) => applyCardUpsert(payload.new as Card)
    )
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'cards', filter: `session_id=eq.${sessionId}` },
      (payload: AnyPayload) => applyCardUpsert(payload.new as Card)
    )
    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'cards', filter: `session_id=eq.${sessionId}` },
      (payload: AnyPayload) => applyCardDelete((payload.old as { id: string }).id)
    )

    // Postgres Changes: votes
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'votes' },
      (payload: AnyPayload) => applyVoteInsert(payload.new as Vote)
    )
    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'votes' },
      (payload: AnyPayload) => applyVoteDelete(payload.old as { card_id: string; user_key: string })
    )

    // Postgres Changes: sessions
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
      (payload: AnyPayload) => setSession(payload.new as Session)
    )

    // Presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, PresenceUser[]>
      const participants = Object.values(state).flat()
      setParticipants(participants)
    })

    // Broadcast: typing indicator
    channel.on('broadcast', { event: 'CARD_TYPING' }, (payload: AnyPayload) => {
      const { cardId, user_key: typingUserKey, display_name } = payload.payload as {
        cardId: string; user_key: string; display_name: string
      }
      if (typingUserKey === userKey) return

      setTyping(cardId, { user_key: typingUserKey, display_name })

      if (typingTimeouts.current[cardId]) clearTimeout(typingTimeouts.current[cardId])
      typingTimeouts.current[cardId] = setTimeout(() => {
        clearTyping(cardId)
        delete typingTimeouts.current[cardId]
      }, 3000)
    })

    // Subscribe
    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_key: userKey,
          display_name: displayName,
          online_at: new Date().toISOString(),
        })
        // Catch-up fetch for any missed events
        await fetchInitialData()
      }
    })

    return () => {
      Object.values(typingTimeouts.current).forEach(clearTimeout)
      typingTimeouts.current = {}
      channel.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userKey, displayName])

  function broadcastTyping(cardId: string) {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'CARD_TYPING',
      payload: { cardId, user_key: userKey, display_name: displayName },
    })
  }

  return { broadcastTyping }
}
