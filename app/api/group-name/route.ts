import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const MAX_CARDS = 20
const MAX_CARD_LENGTH = 500
// Safe group name: title-case words and spaces only
const SAFE_NAME_RE = /^[A-Za-z0-9 ]{1,40}$/

function sanitizeCard(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  // Strip control characters and leading/trailing whitespace; truncate
  return raw.replace(/[\x00-\x1F\x7F]/g, ' ').trim().slice(0, MAX_CARD_LENGTH)
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ name: 'Group' }, { status: 400 })
  }

  const { contents } = body as Record<string, unknown>

  // Validate and sanitize input
  if (
    !Array.isArray(contents) ||
    contents.length === 0 ||
    contents.length > MAX_CARDS ||
    !contents.every((c) => typeof c === 'string')
  ) {
    return NextResponse.json({ name: 'Group' })
  }

  const sanitized = contents.map(sanitizeCard).filter(Boolean)
  if (sanitized.length === 0) {
    return NextResponse.json({ name: 'Group' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ name: 'Group' })
  }

  try {
    const client = new Anthropic({ apiKey })
    // Use XML-style delimiters to isolate user content from instructions
    const cardList = sanitized.map((c, i) => `<card>${i + 1}. ${c}</card>`).join('\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 32,
      messages: [
        {
          role: 'user',
          content: `You are naming a group of retrospective cards. Reply with ONLY a short group name (2-4 words, title case). No punctuation, no explanation.\n\n<cards>\n${cardList}\n</cards>`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    // Only accept a safe alphanumeric name; fall back otherwise
    const name = SAFE_NAME_RE.test(raw) ? raw : 'Group'
    return NextResponse.json({ name })
  } catch {
    return NextResponse.json({ name: 'Group' })
  }
}
