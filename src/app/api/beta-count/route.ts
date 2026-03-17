import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BETA_TOTAL = 100
const BASE_OFFSET = 71

export async function GET() {
  try {
    const res = await fetch('https://api.clerk.com/v1/users/count', {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Clerk ${res.status}`)
    const { count } = await res.json()
    const filled = Math.min((count as number) + BASE_OFFSET, BETA_TOTAL)
    const remaining = Math.max(0, BETA_TOTAL - filled)
    return NextResponse.json({ count: filled, total: BETA_TOTAL, remaining, filled })
  } catch (err) {
    console.error('[beta-count]', err)
    const filled = BASE_OFFSET + 1
    return NextResponse.json({ count: filled, total: BETA_TOTAL, remaining: BETA_TOTAL - filled, filled })
  }
}
