import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BETA_TOTAL = 100

export async function GET() {
  try {
    const res = await fetch('https://api.clerk.com/v1/users/count', {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Clerk ${res.status}`)
    const { count } = await res.json()
    const filled = Math.min(count as number, BETA_TOTAL)
    const remaining = Math.max(0, BETA_TOTAL - filled)
    return NextResponse.json({ count: filled, total: BETA_TOTAL, remaining, filled })
  } catch (err) {
    console.error('[beta-count]', err)
    return NextResponse.json({ count: 1, total: BETA_TOTAL, remaining: BETA_TOTAL - 1, filled: 1 })
  }
}
