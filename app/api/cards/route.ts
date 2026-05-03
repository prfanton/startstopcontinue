import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { session_id, column_id, author_key, content, position } = await req.json()

  if (!session_id || !column_id || !author_key) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('cards')
    .insert({ session_id, column_id, author_key, content: content || '', position: position ?? 0 })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
