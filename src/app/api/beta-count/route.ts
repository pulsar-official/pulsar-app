import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const BETA_TOTAL = 100
const BASE_OFFSET = 71 // seed offset — real signups add on top

export async function GET() {
  try {
    const client = await clerkClient()
    const { totalCount } = await client.users.getUserList({ limit: 1 })
    const filled = Math.min(totalCount + BASE_OFFSET, BETA_TOTAL)
    const remaining = Math.max(0, BETA_TOTAL - filled)
    return NextResponse.json({ count: filled, total: BETA_TOTAL, remaining, filled })
  } catch {
    // fallback: BASE_OFFSET + 1 assumed user
    const filled = BASE_OFFSET + 1
    return NextResponse.json({ count: filled, total: BETA_TOTAL, remaining: BETA_TOTAL - filled, filled })
  }
}
