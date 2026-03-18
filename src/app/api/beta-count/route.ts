import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BETA_TOTAL = 100

export async function GET() {
  try {
    // Count waitlist entries (people who submitted the waitlist form)
    const res = await fetch('https://api.clerk.com/v1/waitlist_entries?limit=1', {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Clerk ${res.status}`)
    const data = await res.json()
    // Clerk returns total_count in the response
    const count = (data.total_count ?? data.count ?? 1) as number
    const filled = Math.min(count, BETA_TOTAL)
    const remaining = Math.max(0, BETA_TOTAL - filled)
    return NextResponse.json({ count: filled, total: BETA_TOTAL, remaining, filled })
  } catch (err) {
    console.error('[beta-count]', err)
    return NextResponse.json({ count: 1, total: BETA_TOTAL, remaining: BETA_TOTAL - 1, filled: 1 })
  }
}
