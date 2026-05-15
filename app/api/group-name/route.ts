import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const { contents } = await req.json()

  if (!Array.isArray(contents) || contents.length === 0) {
    return NextResponse.json({ name: 'Group' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ name: 'Group' })
  }

  try {
    const client = new Anthropic({ apiKey })
    const cardList = contents.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 32,
      messages: [
        {
          role: 'user',
          content: `You are naming a group of retrospective cards. Reply with ONLY a short group name (2-4 words, title case). No punctuation, no explanation.\n\nCards:\n${cardList}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ name: text || 'Group' })
  } catch {
    return NextResponse.json({ name: 'Group' })
  }
}
