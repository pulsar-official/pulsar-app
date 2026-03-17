import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const BETA_TOTAL = 100
const BASE_OFFSET = 71 // seed offset — real signups add on top

export async function GET() {
  try {
    const client = await clerkClient()
    const realCount = await client.users.getCount()
    const filled = Math.min(realCount + BASE_OFFSET, BETA_TOTAL)
    const remaining = Math.max(0, BETA_TOTAL - filled)
    return NextResponse.json({ count: filled, total: BETA_TOTAL, remaining, filled })
  } catch {
    return NextResponse.json({ count: 77, total: 100, remaining: 23, filled: 77 })
  }
}
