import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const CATEGORY_EMOJI: Record<string, string> = {
  bug:     '🐛',
  feature: '💡',
  general: '💬',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { message, category = 'general' } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let userInfo = 'Anonymous'
    if (user) {
      const email = user.email ?? ''
      const name = (user.user_metadata?.full_name as string) ?? (user.user_metadata?.username as string) ?? 'Unknown'
      userInfo = email ? `${name} (${email})` : name
    }

    const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL
    if (webhookUrl) {
      const emoji = CATEGORY_EMOJI[category] ?? '💬'
      const payload = {
        embeds: [{
          title: `${emoji} New ${category} feedback`,
          description: message.slice(0, 4000),
          color: category === 'bug' ? 0xef4444 : category === 'feature' ? 0xa78bfa : 0x6ee7b7,
          fields: [{ name: 'From', value: userInfo, inline: true }],
          timestamp: new Date().toISOString(),
          footer: { text: 'Pulsar Feedback' },
        }],
      }
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      console.log('[Feedback]', { category, userInfo, message })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Feedback] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
