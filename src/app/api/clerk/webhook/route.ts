import { Webhook } from 'svix'
import { db } from '@/lib/db'
import { users } from '@/db/schema'

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) return new Response('Webhook secret not configured', { status: 500 })

  const payload = await req.text()
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }

  let evt: { type: string; data: Record<string, unknown> }
  try {
    const wh = new Webhook(webhookSecret)
    evt = wh.verify(payload, headers) as typeof evt
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const data = evt.data
      const clerkId = data.id as string
      const emailArr = data.email_addresses as { email_address: string }[]
      const phoneArr = data.phone_numbers as { phone_number: string }[]
      const email = emailArr?.[0]?.email_address
      const phone = phoneArr?.[0]?.phone_number ?? null
      const username = (data.username as string) ?? null

      if (email) {
        await db.insert(users)
          .values({ clerkId, email, username, phone })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: { email, username, phone, updatedAt: new Date() },
          })
      }
    }
    return new Response('ok', { status: 200 })
  } catch {
    return new Response('error', { status: 500 })
  }
}
