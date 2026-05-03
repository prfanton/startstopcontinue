import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { facilitator_id, title, format } = await req.json()

  if (!facilitator_id) {
    return NextResponse.json({ error: 'facilitator_id required' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert({ facilitator_id, title: title || 'Team Retrospective', format: format || 'wwwdw' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
