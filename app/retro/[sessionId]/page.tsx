import { notFound } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import RetroBoard from '@/components/board/RetroBoard'
import type { Session } from '@/types/retro'

export default async function RetroPage(props: PageProps<'/retro/[sessionId]'>) {
  const { sessionId } = await props.params
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !data) {
    notFound()
  }

  return <RetroBoard session={data as Session} />
}
